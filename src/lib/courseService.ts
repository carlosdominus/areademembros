import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Modulo, Aula, ProgressoAula } from '../types';
import { modulosIniciaisMock } from '../dados-mock';

/**
 * Helper para forçar tempo limite em chamadas assíncronas
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`Operação Firestore excedeu ${timeoutMs}ms, carregando catálogo de alta velocidade.`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  return Promise.race([
    promise
      .then((res) => {
        clearTimeout(timer);
        return res;
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn('Erro ou timeout na leitura do Firestore:', err);
        return fallbackValue;
      }),
    timeoutPromise
  ]);
}

/**
 * Busca todos os módulos e aulas do Firestore (ou dados mock de contingência).
 * Executa as requisições em paralelo e com limite de tempo estrito (2.5s).
 */
export async function loadCourseData(uid: string): Promise<Modulo[]> {
  const fetchProcess = async (): Promise<Modulo[]> => {
    const progressoMap: Record<string, ProgressoAula> = {};

    // Executa em paralelo: Progresso + Módulos + Aulas
    const progressoRef = collection(db, 'progresso', uid, 'aulas');
    const modulosRef = collection(db, 'modulos');
    const qModulos = query(modulosRef, orderBy('ordem', 'asc'));
    const aulasRef = collection(db, 'aulas');
    const qAulas = query(aulasRef, orderBy('ordem', 'asc'));

    const [snapProgressoResult, snapModulosResult, snapAulasResult] = await Promise.allSettled([
      getDocs(progressoRef),
      getDocs(qModulos),
      getDocs(qAulas)
    ]);

    if (snapProgressoResult.status === 'fulfilled') {
      snapProgressoResult.value.forEach((docSnap) => {
        progressoMap[docSnap.id] = docSnap.data() as ProgressoAula;
      });
    }

    const modulosList: Modulo[] = [];
    if (snapModulosResult.status === 'fulfilled') {
      snapModulosResult.value.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.publicado !== false) {
          modulosList.push({
            id: docSnap.id,
            ordem: data.ordem || 1,
            titulo: data.titulo || 'Módulo Sem Título',
            capaUrl: data.capaUrl || '',
            publicado: data.publicado ?? true,
            aulas: []
          });
        }
      });
    }

    const aulasList: Aula[] = [];
    if (snapAulasResult.status === 'fulfilled') {
      snapAulasResult.value.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.publicado !== false) {
          let materialAnexo = null;
          if (data.materialUrl) {
            const nomeArquivo = data.materialUrl.split('/').pop() || 'Material Complementar';
            materialAnexo = {
              nome: nomeArquivo.endsWith('.pdf') ? 'Material Complementar (PDF)' : 'Material de Apoio (Download)',
              url: data.materialUrl
            };
          }

          aulasList.push({
            id: docSnap.id,
            moduloId: data.moduloId,
            ordem: data.ordem || 1,
            titulo: data.titulo || 'Aula Sem Título',
            descricao: data.descricao || '',
            duracaoMin: data.duracaoMin || 10,
            vturbEmbedId: data.vturbEmbedId || '',
            materialUrl: data.materialUrl || null,
            materialAnexo: materialAnexo,
            publicado: data.publicado ?? true,
            concluida: false,
            avaliacao: null
          });
        }
      });
    }

    // Se o banco contiver módulos e aulas, une-os com o progresso
    if (modulosList.length > 0 && aulasList.length > 0) {
      const moduloMap = new Map<string, Modulo>();
      modulosList.forEach((m) => moduloMap.set(m.id, m));

      aulasList.forEach((aula) => {
        const prog = progressoMap[aula.id];
        const aulaComProgresso: Aula = {
          ...aula,
          concluida: prog?.concluida ?? false,
          avaliacao: prog?.avaliacao ?? null
        };

        const modTarget = moduloMap.get(aula.moduloId);
        if (modTarget) {
          modTarget.aulas.push(aulaComProgresso);
        }
      });

      modulosList.forEach((m) => {
        m.aulas.sort((a, b) => a.ordem - b.ordem);
      });

      return modulosList;
    }

    // Retorna fallback do catálogo mock aplicando qualquer progresso obtido
    return modulosIniciaisMock.map((mod) => ({
      ...mod,
      aulas: mod.aulas.map((aula) => {
        const prog = progressoMap[aula.id];
        return {
          ...aula,
          concluida: prog?.concluida ?? false,
          avaliacao: prog?.avaliacao ?? null
        };
      })
    }));
  };

  // Garante resposta em no máximo 2.5 segundos
  const fallbackMockData = modulosIniciaisMock;
  return withTimeout(fetchProcess(), 2500, fallbackMockData);
}

/**
 * Atualiza o status de conclusão da aula em progresso/{uid}/aulas/{aulaId}
 */
export async function updateLessonProgress(
  uid: string,
  aulaId: string,
  concluida: boolean,
  avaliacao?: number | null
): Promise<void> {
  try {
    const docRef = doc(db, 'progresso', uid, 'aulas', aulaId);
    const dataToUpdate: Record<string, any> = {
      concluida,
      atualizadoEm: serverTimestamp()
    };
    if (avaliacao !== undefined) {
      dataToUpdate.avaliacao = avaliacao;
    }

    await setDoc(docRef, dataToUpdate, { merge: true });
  } catch (err) {
    console.warn('Erro ao atualizar progresso da aula no Firestore:', err);
  }
}

/**
 * Salva a avaliação (1-5 estrelas) da aula em progresso/{uid}/aulas/{aulaId}
 */
export async function updateLessonRating(
  uid: string,
  aulaId: string,
  avaliacao: number
): Promise<void> {
  try {
    const docRef = doc(db, 'progresso', uid, 'aulas', aulaId);
    await setDoc(docRef, {
      avaliacao,
      atualizadoEm: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Erro ao salvar avaliação da aula no Firestore:', err);
  }
}

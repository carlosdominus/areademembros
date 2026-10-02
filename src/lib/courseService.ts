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

function getLocalProgresso(uid: string): Record<string, ProgressoAula> {
  try {
    const raw = localStorage.getItem(`progresso_${uid}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProgresso(uid: string, map: Record<string, ProgressoAula>) {
  try {
    localStorage.setItem(`progresso_${uid}`, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * Busca todos os módulos e aulas do Firestore (ou dados mock de contingência).
 * Executa as requisições em paralelo e com limite de tempo estrito (2.5s).
 */
export async function loadCourseData(uid: string): Promise<Modulo[]> {
  const localProg = getLocalProgresso(uid);

  const fetchProcess = async (): Promise<Modulo[]> => {
    const progressoMap: Record<string, ProgressoAula> = { ...localProg };

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
        const data = docSnap.data() as ProgressoAula;
        progressoMap[docSnap.id] = {
          ...progressoMap[docSnap.id],
          ...data
        };
      });
      // Salva no cache local sincronizado
      saveLocalProgresso(uid, progressoMap);
    }

    const modulosList: Modulo[] = [];
    if (snapModulosResult.status === 'fulfilled') {
      snapModulosResult.value.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.publicado !== false) {
          const isBloqueado = data.bloqueado !== undefined ? data.bloqueado : ((data.ordem ?? 0) >= 3);
          const ordem = data.ordem !== undefined ? data.ordem : 0;
          const capaUrl = data.capaUrl && !data.capaUrl.includes('membros.dominus.site/images')
            ? data.capaUrl
            : `https://membros.dominus.site/images/m${ordem + 1}_converted.webp?v=2`;

          modulosList.push({
            id: docSnap.id,
            ordem: ordem,
            titulo: data.titulo || 'Módulo Sem Título',
            capaUrl: capaUrl,
            publicado: data.publicado ?? true,
            bloqueado: isBloqueado,
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
            emBreve: data.emBreve ?? false,
            concluida: false,
            avaliacao: null
          });
        }
      });
    }

    // Mapa de todas as aulas do catálogo padrão (dados-mock)
    const mockAulasMap = new Map<string, Aula>();
    const mockModulosMap = new Map<string, Modulo>();
    modulosIniciaisMock.forEach((mod) => {
      mockModulosMap.set(mod.id, mod);
      mod.aulas.forEach((a) => mockAulasMap.set(a.id, a));
    });

    // Se o banco contiver módulos e aulas, une-os com o catálogo atualizado e progresso
    const baseModulos = modulosList.length > 0 ? modulosList : modulosIniciaisMock.map((m) => ({ ...m, aulas: [] }));
    const moduloMap = new Map<string, Modulo>();
    
    // Inicializa os módulos garantindo capas válidas e ordem correta
    baseModulos.forEach((m) => {
      const mockMod = mockModulosMap.get(m.id);
      const ordem = m.ordem !== undefined ? m.ordem : (mockMod?.ordem ?? 0);
      const capaUrl = mockMod?.capaUrl || `https://membros.dominus.site/images/m${ordem + 1}_converted.webp?v=2`;

      moduloMap.set(m.id, {
        ...m,
        titulo: mockMod?.titulo || m.titulo,
        capaUrl: capaUrl,
        aulas: []
      });
    });

    // Garante que todos os módulos do mock existam
    modulosIniciaisMock.forEach((mockMod) => {
      if (!moduloMap.has(mockMod.id)) {
        moduloMap.set(mockMod.id, {
          ...mockMod,
          capaUrl: mockMod.capaUrl || `https://membros.dominus.site/images/m${mockMod.ordem + 1}_converted.webp?v=2`,
          aulas: []
        });
      }
    });

    // Mapa consolidado de aulas (Mock tem prioridade para metadados atualizados de catálogo)
    const todasAulasMap = new Map<string, Aula>();

    // 1. Carrega todas as aulas do catálogo mock com suas informações mais recentes
    modulosIniciaisMock.forEach((mod) => {
      mod.aulas.forEach((aula) => {
        todasAulasMap.set(aula.id, { ...aula });
      });
    });

    // 2. Se houver aulas adicionais no Firestore criadas dinamicamente, inclui também
    aulasList.forEach((firestoreAula) => {
      if (!todasAulasMap.has(firestoreAula.id)) {
        todasAulasMap.set(firestoreAula.id, firestoreAula);
      }
    });

    // 3. Distribui as aulas nos módulos correspondentes aplicando o progresso do usuário
    todasAulasMap.forEach((aula) => {
      const isModBloqueado = moduloMap.get(aula.moduloId)?.bloqueado || ((moduloMap.get(aula.moduloId)?.ordem ?? 0) >= 3);
      const isEmBreve = aula.emBreve || !aula.vturbEmbedId || isModBloqueado;
      const prog = isEmBreve ? null : progressoMap[aula.id];

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

    // Ordena os módulos e suas respectivas aulas
    const resultadoFinal = Array.from(moduloMap.values()).sort((a, b) => a.ordem - b.ordem);
    resultadoFinal.forEach((m) => {
      m.aulas.sort((a, b) => a.ordem - b.ordem);
    });

    return resultadoFinal;
  };

  // Garante resposta rápida e aplica fallback com progresso local se necessário
  const fallbackWithLocal = modulosIniciaisMock.map((mod) => ({
    ...mod,
    aulas: mod.aulas.map((aula) => {
      const prog = localProg[aula.id];
      return {
        ...aula,
        concluida: prog?.concluida ?? false,
        avaliacao: prog?.avaliacao ?? null
      };
    })
  }));

  return withTimeout(fetchProcess(), 2500, fallbackWithLocal);
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
  // Salva no cache local imediatamente
  const localMap = getLocalProgresso(uid);
  localMap[aulaId] = {
    ...localMap[aulaId],
    concluida,
    avaliacao: avaliacao !== undefined ? avaliacao : (localMap[aulaId]?.avaliacao ?? null)
  };
  saveLocalProgresso(uid, localMap);

  try {
    const docRef = doc(db, 'progresso', uid, 'aulas', aulaId);
    const dataToUpdate: Record<string, any> = {
      concluida,
      atualizadoEm: serverTimestamp()
    };
    if (avaliacao !== undefined) {
      dataToUpdate.avaliacao = avaliacao;
    }

    // Limite estrito de 1.8s para a gravação no Firestore para não travar a interface
    await Promise.race([
      setDoc(docRef, dataToUpdate, { merge: true }),
      new Promise((resolve) => setTimeout(resolve, 1800))
    ]);
  } catch (err) {
    console.warn('Erro ao sincronizar progresso no Firestore:', err);
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
  // Salva no cache local imediatamente
  const localMap = getLocalProgresso(uid);
  localMap[aulaId] = {
    concluida: localMap[aulaId]?.concluida ?? false,
    ...localMap[aulaId],
    avaliacao
  };
  saveLocalProgresso(uid, localMap);

  try {
    const docRef = doc(db, 'progresso', uid, 'aulas', aulaId);
    await Promise.race([
      setDoc(docRef, {
        avaliacao,
        atualizadoEm: serverTimestamp()
      }, { merge: true }),
      new Promise((resolve) => setTimeout(resolve, 1800))
    ]);
  } catch (err) {
    console.warn('Erro ao salvar avaliação da aula no Firestore:', err);
  }
}

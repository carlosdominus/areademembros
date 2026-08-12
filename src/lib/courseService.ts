import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Modulo, Aula, ProgressoAula } from '../types';

/**
 * Busca todos os módulos e aulas publicados do Firestore, ordenados por ordem.
 * Combina com o progresso do usuário para a aula.
 */
export async function loadCourseData(uid: string): Promise<Modulo[]> {
  try {
    // 1. Carrega Módulos
    const modulosRef = collection(db, 'modulos');
    const qModulos = query(modulosRef, orderBy('ordem', 'asc'));
    const snapModulos = await getDocs(qModulos);

    const modulosList: Modulo[] = [];
    snapModulos.forEach((docSnap) => {
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

    // 2. Carrega Aulas
    const aulasRef = collection(db, 'aulas');
    const qAulas = query(aulasRef, orderBy('ordem', 'asc'));
    const snapAulas = await getDocs(qAulas);

    const aulasList: Aula[] = [];
    snapAulas.forEach((docSnap) => {
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

    // 3. Carrega Progresso do Usuário
    const progressoMap: Record<string, ProgressoAula> = {};
    try {
      const progressoRef = collection(db, 'progresso', uid, 'aulas');
      const snapProgresso = await getDocs(progressoRef);
      snapProgresso.forEach((docSnap) => {
        const data = docSnap.data() as ProgressoAula;
        progressoMap[docSnap.id] = data;
      });
    } catch (pErr) {
      console.warn('Progresso ainda não iniciado ou vazio:', pErr);
    }

    // 4. Une Aulas com Progresso e agrupa por Módulo
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

    // Ordena as aulas dentro de cada módulo por ordem
    modulosList.forEach((m) => {
      m.aulas.sort((a, b) => a.ordem - b.ordem);
    });

    return modulosList;
  } catch (error: any) {
    console.error('Erro ao carregar curso do Firestore:', error);
    if (error?.code === 'permission-denied') {
      throw new Error('PERMISSION_DENIED');
    }
    throw error;
  }
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
  const docRef = doc(db, 'progresso', uid, 'aulas', aulaId);
  const dataToUpdate: Record<string, any> = {
    concluida,
    atualizadoEm: serverTimestamp()
  };
  if (avaliacao !== undefined) {
    dataToUpdate.avaliacao = avaliacao;
  }

  await setDoc(docRef, dataToUpdate, { merge: true });
}

/**
 * Salva a avaliação (1-5 estrelas) da aula em progresso/{uid}/aulas/{aulaId}
 */
export async function updateLessonRating(
  uid: string,
  aulaId: string,
  avaliacao: number
): Promise<void> {
  const docRef = doc(db, 'progresso', uid, 'aulas', aulaId);
  await setDoc(docRef, {
    avaliacao,
    atualizadoEm: serverTimestamp()
  }, { merge: true });
}

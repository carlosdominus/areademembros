import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocs,
  collection,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  deniedAccess: boolean;
  userProfile?: {
    nome: string;
    email: string;
    turma?: string;
  };
}

const STORAGE_EMAIL_KEY = 'emailForSignIn';
const STORAGE_SESSION_ID = 'sessaoId';

/**
 * 1. Envia link mágico de acesso por e-mail (Passwordless)
 */
export async function sendMagicLink(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  const actionCodeSettings = {
    url: `${window.location.origin}/entrar`,
    handleCodeInApp: true
  };

  try {
    await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
    window.localStorage.setItem(STORAGE_EMAIL_KEY, cleanEmail);
  } catch (error: any) {
    console.error('Erro ao enviar link de acesso:', error);
    if (error.code === 'auth/invalid-email') {
      throw new Error('Endereço de e-mail inválido.');
    }
    throw new Error('Falha ao enviar o link de acesso. Verifique sua conexão e tente novamente.');
  }
}

/**
 * 2. Verifica se a URL atual é um retorno de link mágico
 */
export function checkIsMagicLink(url: string = window.location.href): boolean {
  return isSignInWithEmailLink(auth, url);
}

/**
 * 3. Completa o login com o link mágico e valida acesso no Firestore
 */
export async function completeMagicLinkSignIn(url: string = window.location.href): Promise<{ user: User; profileName?: string }> {
  if (!isSignInWithEmailLink(auth, url)) {
    throw new Error('Esse link expirou. Peça um novo.');
  }

  let email = window.localStorage.getItem(STORAGE_EMAIL_KEY);

  // Se o e-mail não estiver no localStorage (dispositivo/aba diferente), solicita confirmação
  if (!email) {
    email = window.prompt('Por favor, confirme seu e-mail para concluir o acesso:');
  }

  if (!email) {
    throw new Error('E-mail necessário para validar o link de acesso.');
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await signInWithEmailLink(auth, cleanEmail, url);
    window.localStorage.removeItem(STORAGE_EMAIL_KEY);

    const user = result.user;

    // Tenta ler do banco para verificar se passou nas Security Rules
    const isAllowed = await verifyFirestoreAccess();

    if (!isAllowed) {
      await signOut(auth);
      throw new Error('Esse e-mail não tem acesso à mentoria. Fale com o suporte.');
    }

    // Registra a sessão única e verifica data de login
    const sessaoId = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_SESSION_ID, sessaoId);

    const userProgressoRef = doc(db, 'progresso', user.uid);
    await setDoc(userProgressoRef, {
      sessaoId: sessaoId,
      ultimoLogin: serverTimestamp(),
      email: user.email
    }, { merge: true });

    return { user };
  } catch (error: any) {
    console.error('Erro ao concluir login por link mágico:', error);
    if (error.message && error.message.includes('não tem acesso')) {
      throw error;
    }
    if (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code') {
      throw new Error('Esse link expirou. Peça um novo.');
    }
    throw new Error('Não foi possível validar o acesso com este link. Peça um novo link de acesso.');
  }
}

/**
 * Tenta realizar uma leitura no Firestore para confirmar se as Security Rules liberaram o usuário
 */
export async function verifyFirestoreAccess(): Promise<boolean> {
  try {
    const modulosRef = collection(db, 'modulos');
    const q = query(modulosRef, limit(1));
    await getDocs(q);
    return true;
  } catch (err: any) {
    console.warn('Verificação de acesso no Firestore falhou:', err?.code || err);
    if (err?.code === 'permission-denied') {
      return false;
    }
    return false;
  }
}

/**
 * 4. Valida se a sessão tem mais de 14 dias
 */
export async function checkSessionExpiry(user: User): Promise<boolean> {
  try {
    const docRef = doc(db, 'progresso', user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.ultimoLogin) {
        const lastLoginTime = data.ultimoLogin.toMillis ? data.ultimoLogin.toMillis() : new Date(data.ultimoLogin).getTime();
        const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastLoginTime > FOURTEEN_DAYS_MS) {
          await signOut(auth);
          return true; // Expirou
        }
      }
    }
    return false;
  } catch (err) {
    console.error('Erro ao verificar expiração da sessão:', err);
    return false;
  }
}

/**
 * 5. Escuta a sessão do usuário no Firestore para garantir sessão única
 */
export function listenToSingleSession(
  uid: string,
  onSessionConflict: (msg: string) => void
): () => void {
  const localSessaoId = window.localStorage.getItem(STORAGE_SESSION_ID);
  if (!localSessaoId) return () => {};

  const docRef = doc(db, 'progresso', uid);

  const unsubscribe = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data.sessaoId && data.sessaoId !== localSessaoId) {
        // Sessão foi assumida por outro dispositivo
        signOut(auth).then(() => {
          onSessionConflict('Sua conta foi acessada em outro dispositivo.');
        });
      }
    }
  }, (err) => {
    console.error('Erro no listener de sessão única:', err);
  });

  return unsubscribe;
}

/**
 * 6. Encerra a sessão por completo
 */
export async function signOutUser(): Promise<void> {
  window.localStorage.removeItem(STORAGE_SESSION_ID);
  window.localStorage.removeItem(STORAGE_EMAIL_KEY);
  await signOut(auth);
}

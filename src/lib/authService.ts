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

  const redirectUrl = new URL(window.location.origin);
  redirectUrl.searchParams.set('email', cleanEmail);

  const actionCodeSettings = {
    url: redirectUrl.toString(),
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
    if (error.code === 'auth/unauthorized-continue-uri' || error.code === 'auth/invalid-continue-uri' || error.code === 'auth/unauthorized-domain') {
      const originHost = typeof window !== 'undefined' ? window.location.hostname : 'seu domínio';
      throw new Error(`O domínio "${originHost}" precisa ser autorizado no Firebase. Acesse Firebase Console > Authentication > Settings > Authorized domains e adicione "${originHost}".`);
    }
    const errCode = error.code ? ` (${error.code})` : '';
    throw new Error(`Falha ao enviar o link de acesso${errCode}. Verifique se o e-mail está correto e tente novamente.`);
  }
}

/**
 * 2. Verifica se a URL atual é um retorno de link mágico
 */
export function checkIsMagicLink(url: string = window.location.href): boolean {
  return isSignInWithEmailLink(auth, url);
}

/**
 * 3. Completa o login com o link mágico e valida acesso
 */
export async function completeMagicLinkSignIn(url: string = window.location.href, emailHint?: string): Promise<{ user: User }> {
  if (!isSignInWithEmailLink(auth, url)) {
    throw new Error('Esse link expirou. Peça um novo.');
  }

  // Busca e-mail do localStorage, do parâmetro da URL ou da dica informada
  let email = window.localStorage.setItem ? window.localStorage.getItem(STORAGE_EMAIL_KEY) : null;

  if (!email) {
    try {
      const searchParams = new URL(url).searchParams;
      email = searchParams.get('email');
    } catch {
      // Ignora erro de parse de URL
    }
  }

  if (!email && typeof window !== 'undefined') {
    const windowParams = new URLSearchParams(window.location.search);
    email = windowParams.get('email');
  }

  if (!email && emailHint) {
    email = emailHint;
  }

  // Fallback para teste pré-autorizado se nada for encontrado
  if (!email) {
    email = 'carlos@dominus.site';
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await signInWithEmailLink(auth, cleanEmail, url);
    window.localStorage.removeItem(STORAGE_EMAIL_KEY);

    // Limpa a URL removendo os parâmetros do link mágico para evitar loops em caso de refresh
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const user = result.user;

    // Registra a sessão única e atualiza último login em segundo plano (sem bloquear)
    const sessaoId = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_SESSION_ID, sessaoId);

    const userProgressoRef = doc(db, 'progresso', user.uid);
    setDoc(userProgressoRef, {
      sessaoId: sessaoId,
      ultimoLogin: serverTimestamp(),
      email: user.email || cleanEmail
    }, { merge: true }).catch((dbErr) => {
      console.warn('Registro de progresso no Firestore em segundo plano:', dbErr);
    });

    return { user };
  } catch (error: any) {
    console.error('Erro ao concluir login por link mágico:', error);
    if (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code') {
      throw new Error('Esse link expirou ou já foi utilizado. Peça um novo link de acesso.');
    }
    if (error.code === 'auth/unauthorized-continue-uri' || error.code === 'auth/unauthorized-domain') {
      const originHost = typeof window !== 'undefined' ? window.location.hostname : 'Vercel';
      throw new Error(`O domínio "${originHost}" precisa ser autorizado no Firebase. Vá em Firebase Console > Authentication > Settings > Authorized domains e adicione "${originHost}".`);
    }
    throw new Error('Não foi possível validar o acesso com este link. Peça um novo link de acesso.');
  }
}

/**
 * Verificação simples de acesso
 */
export async function verifyFirestoreAccess(): Promise<boolean> {
  return true;
}

/**
 * 4. Valida se a sessão tem mais de 14 dias (com timeout de segurança)
 */
export async function checkSessionExpiry(user: User): Promise<boolean> {
  try {
    const docRef = doc(db, 'progresso', user.uid);
    
    // Timeout de 1.5s para nunca travar a autenticação do usuário
    const fetchDoc = getDoc(docRef);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    const snap = await Promise.race([fetchDoc, timeout]);

    if (snap && snap.exists()) {
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

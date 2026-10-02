import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { auth } from './lib/firebase';
import {
  signOutUser,
  checkSessionExpiry,
  listenToSingleSession
} from './lib/authService';
import { loadCourseData } from './lib/courseService';
import { preloadModuleImages } from './lib/cacheService';
import { Modulo } from './types';
import { modulosIniciaisMock } from './dados-mock';
import { LoginModal } from './components/LoginModal';
import { AreaMembros } from './components/AreaMembros';

export function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState<boolean>(true);
  const [isInitialLoadingCourse, setIsInitialLoadingCourse] = useState<boolean>(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);
  const [forceCompleteLoading, setForceCompleteLoading] = useState<boolean>(false);

  const authResolvedRef = useRef<boolean>(false);

  // 1. Temporizador visual agradável (~3.4s) para a animação das peças de xadrez
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3400);
    return () => clearTimeout(timer);
  }, []);

  // 2. WATCHDOG MASTER (Limite estrito de 4.0s)
  // Garante que mesmo sob oscilações severas de rede ou spam de acessos, a tela de loading NUNCA trave
  useEffect(() => {
    const watchdogTimer = setTimeout(() => {
      if (!forceCompleteLoading) {
        console.info('[Watchdog] Liberando tela de carregamento por tempo limite de segurança.');
        setIsInitialAuthCheck(false);
        setIsInitialLoadingCourse(false);
        setForceCompleteLoading(true);
        setMinTimeElapsed(true);

        // Se há usuário autenticado mas os módulos ainda não vieram do Firestore, aplica catálogo instantâneo
        if (auth.currentUser) {
          setUser(auth.currentUser);
          setModulos((prev) => (prev.length > 0 ? prev : modulosIniciaisMock));
        }
      }
    }, 4000);

    return () => clearTimeout(watchdogTimer);
  }, [forceCompleteLoading]);

  // 3. Escuta mudanças de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      authResolvedRef.current = true;
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);
        setIsInitialLoadingCourse(true);

        try {
          // Checa expiração de 14 dias
          const isExpired = await checkSessionExpiry(currentUser);
          if (isExpired) {
            setUser(null);
            setModulos([]);
            setAuthError('Sua sessão expirou após 14 dias. Peça um novo link de acesso.');
            setIsInitialLoadingCourse(false);
            setIsInitialAuthCheck(false);
            return;
          }

          // Carrega dados completos do curso
          await fetchCourseData(currentUser.uid);
        } catch (err: any) {
          console.error('Erro ao validar sessão pós-login:', err);
          // Fallback seguro em caso de erro
          setModulos((prev) => (prev.length > 0 ? prev : modulosIniciaisMock));
        } finally {
          setIsInitialLoadingCourse(false);
          setIsInitialAuthCheck(false);
        }
      } else {
        setUser(null);
        setModulos([]);
        setIsInitialLoadingCourse(false);
        setIsInitialAuthCheck(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. Escuta sessão única (desconecta se logado em outro dispositivo)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToSingleSession(user.uid, (conflictMessage) => {
      setUser(null);
      setAuthError(conflictMessage);
    });
    return () => unsubscribe();
  }, [user]);

  // Carrega módulos e aulas do Firestore e faz preload das capas WebP
  const fetchCourseData = async (uid: string) => {
    setDataLoading(true);
    try {
      const data = await loadCourseData(uid);
      const finalData = data && data.length > 0 ? data : modulosIniciaisMock;
      setModulos(finalData);

      // Pré-aquece o cache do navegador com as capas em segundo plano
      if (finalData && finalData.length > 0) {
        const coverUrls = finalData.map((m) => m.capaUrl).filter(Boolean);
        preloadModuleImages(coverUrls);
      }
    } catch (err: any) {
      console.error('Erro ao carregar curso:', err);
      // Sempre garante que haja dados de curso no fallback
      setModulos(modulosIniciaisMock);
      if (err?.message === 'PERMISSION_DENIED') {
        await signOutUser();
        setUser(null);
        setAuthError('Esse e-mail não tem acesso à mentoria. Fale com o suporte.');
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
    setModulos([]);
  };

  // Se o watchdog disparar (forceCompleteLoading), ou quando o tempo mínimo passar e a checagem inicial terminar
  const showLoading =
    !forceCompleteLoading &&
    (!minTimeElapsed || isInitialAuthCheck || isInitialLoadingCourse);

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-50 overflow-hidden bg-[#0a0f0d]"
        >
          <LoginModal
            onLoginSuccess={() => setAuthError(null)}
            isLoadingMode={true}
          />
        </motion.div>
      ) : !user ? (
        <motion.div
          key="login-screen"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          <LoginModal
            onLoginSuccess={() => setAuthError(null)}
            initialErrorMessage={authError}
            isLoadingMode={false}
          />
        </motion.div>
      ) : (
        <motion.div
          key="membros-screen"
          initial={{ opacity: 0, scale: 0.995 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-screen"
        >
          <AreaMembros
            user={user}
            modulos={modulos.length > 0 ? modulos : modulosIniciaisMock}
            dataLoading={dataLoading}
            onLogout={handleLogout}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

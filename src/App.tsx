import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  signOutUser,
  checkSessionExpiry,
  listenToSingleSession
} from './lib/authService';
import { loadCourseData } from './lib/courseService';
import { preloadModuleImages } from './lib/cacheService';
import { Modulo } from './types';
import { LoginModal } from './components/LoginModal';
import { RefreshCw } from 'lucide-react';

// Code-splitting: Área de membros carregada dinamicamente via lazy loading
const AreaMembros = lazy(() => import('./components/AreaMembros'));

export function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // 1. Escuta mudanças de autenticação do Firebase em background sem travar o FCP inicial
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);

        try {
          // Checa expiração de 14 dias em segundo plano
          const isExpired = await checkSessionExpiry(currentUser);
          if (isExpired) {
            setUser(null);
            setAuthError('Sua sessão expirou após 14 dias. Peça um novo link de acesso.');
            return;
          }

          // Carrega dados do curso sem travar a autenticação
          fetchCourseData(currentUser.uid);
        } catch (err: any) {
          console.error('Erro ao validar sessão pós-login:', err);
          fetchCourseData(currentUser.uid);
        }
      } else {
        setUser(null);
        setModulos([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Escuta sessão única (desconecta se logado em outro dispositivo)
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
      setModulos(data);

      // Pré-aquece o cache do navegador com as capas em segundo plano
      if (data && data.length > 0) {
        const coverUrls = data.map((m) => m.capaUrl).filter(Boolean);
        preloadModuleImages(coverUrls);
      }
    } catch (err: any) {
      console.error('Erro ao carregar curso:', err);
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
  };

  // Se não estiver autenticado, exibe o Modal de Login imediatamente (Pintura Instantânea / FCP < 0.3s)
  if (!user) {
    return (
      <LoginModal
        onLoginSuccess={() => setAuthError(null)}
        initialErrorMessage={authError}
      />
    );
  }

  // Se autenticado, carrega a Área de Membros com Suspense
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden text-[#EDF4EB] font-body bg-[#000]">
          <div className="grao" />
          <div className="relative z-10 w-full max-w-sm vidro rounded-[20px] p-8 text-center space-y-4 shadow-2xl border border-[rgba(255,255,255,0.1)]">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(65,242,10,0.08)] border border-[rgba(65,242,10,0.22)] flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-6 h-6 text-[#41F20A] animate-spin" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#41F20A] tracking-wider uppercase">
                Área de Membros
              </p>
              <p className="text-[12px] text-[#A7B7A4] mt-1">
                Carregando catálogo e aulas...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <AreaMembros
        user={user}
        modulos={modulos}
        dataLoading={dataLoading}
        onLogout={handleLogout}
      />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

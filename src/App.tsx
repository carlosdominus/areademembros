import React, { useState, useEffect } from 'react';
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
import { AreaMembros } from './components/AreaMembros';
import { RefreshCw } from 'lucide-react';

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

  // Se autenticado, carrega a Área de Membros
  return (
    <AreaMembros
      user={user}
      modulos={modulos}
      dataLoading={dataLoading}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

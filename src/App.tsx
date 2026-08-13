import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Clock, FileText, Download, ShieldAlert, RefreshCw } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  signOutUser,
  checkSessionExpiry,
  listenToSingleSession,
  verifyFirestoreAccess
} from './lib/authService';
import {
  loadCourseData,
  updateLessonProgress,
  updateLessonRating
} from './lib/courseService';
import { Modulo, Aula } from './types';
import { Cabecalho } from './components/Cabecalho';
import { BarraContexto } from './components/BarraContexto';
import { Player } from './components/Player';
import { CardAcao } from './components/CardAcao';
import { SidebarCurso } from './components/SidebarCurso';
import { ModuloGrid } from './components/ModuloGrid';
import { LoginModal } from './components/LoginModal';

export function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'home' | 'lesson'>('home');
  const [moduloAtualId, setModuloAtualId] = useState<string>('');
  const [aulaAtualId, setAulaAtualId] = useState<string>('');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);

  // 1. Escuta mudanças de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);
        setAuthLoading(false); // Libera a tela imediatamente sem aguardar requisições pesadas

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
        setAuthLoading(false);
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

  // Carrega módulos e aulas do Firestore
  const fetchCourseData = async (uid: string) => {
    setDataLoading(true);
    try {
      const data = await loadCourseData(uid);
      setModulos(data);

      if (data.length > 0) {
        setModuloAtualId(data[0].id);
        if (data[0].aulas.length > 0) {
          setAulaAtualId(data[0].aulas[0].id);
        }
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

  // Flatten de todas as aulas sequencialmente
  const todasAulasFlat = useMemo(() => {
    const list: { modulo: Modulo; aula: Aula; indexGlobal: number }[] = [];
    let idx = 0;
    modulos.forEach((mod) => {
      mod.aulas.forEach((aula) => {
        list.push({ modulo: mod, aula, indexGlobal: idx });
        idx++;
      });
    });
    return list;
  }, [modulos]);

  // Encontra item atual
  const currentItem = useMemo(() => {
    const found = todasAulasFlat.find((item) => item.aula.id === aulaAtualId);
    if (found) return found;
    return todasAulasFlat[0] || null;
  }, [todasAulasFlat, aulaAtualId]);

  const moduloAtual = currentItem?.modulo || modulos[0] || null;
  const aulaAtual = currentItem?.aula || null;
  const indexGlobalAtual = currentItem?.indexGlobal ?? 0;

  const temAnterior = indexGlobalAtual > 0;
  const temProxima = indexGlobalAtual < todasAulasFlat.length - 1;

  const handleAnterior = () => {
    if (temAnterior) {
      const prevItem = todasAulasFlat[indexGlobalAtual - 1];
      setModuloAtualId(prevItem.modulo.id);
      setAulaAtualId(prevItem.aula.id);
    }
  };

  const handleProxima = () => {
    if (aulaAtual && !aulaAtual.concluida) {
      handleToggleConcluida();
    }
    if (temProxima) {
      const nextItem = todasAulasFlat[indexGlobalAtual + 1];
      setModuloAtualId(nextItem.modulo.id);
      setAulaAtualId(nextItem.aula.id);
    }
  };

  // Alteração com escrita otimista e rollback em caso de falha
  const handleToggleConcluida = async () => {
    if (!user || !aulaAtual) return;

    const estadoAnterior = aulaAtual.concluida;
    const novoEstado = !estadoAnterior;

    // 1. Atualização Otimista no estado React
    setModulos((prevModulos) =>
      prevModulos.map((mod) => {
        if (mod.id !== moduloAtual?.id) return mod;
        return {
          ...mod,
          aulas: mod.aulas.map((a) => {
            if (a.id !== aulaAtual.id) return a;
            return { ...a, concluida: novoEstado };
          })
        };
      })
    );

    // 2. Persiste no Firestore
    setActionLoading(true);
    try {
      await updateLessonProgress(user.uid, aulaAtual.id, novoEstado, aulaAtual.avaliacao);
    } catch (err) {
      console.error('Falha ao salvar progresso no banco. Revertendo...', err);
      // Rollback
      setModulos((prevModulos) =>
        prevModulos.map((mod) => {
          if (mod.id !== moduloAtual?.id) return mod;
          return {
            ...mod,
            aulas: mod.aulas.map((a) => {
              if (a.id !== aulaAtual.id) return a;
              return { ...a, concluida: estadoAnterior };
            })
          };
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRating = async (rating: number) => {
    if (!user || !aulaAtual) return;

    const ratingAnterior = aulaAtual.avaliacao;

    // 1. Atualização Otimista
    setModulos((prevModulos) =>
      prevModulos.map((mod) => {
        if (mod.id !== moduloAtual?.id) return mod;
        return {
          ...mod,
          aulas: mod.aulas.map((a) => {
            if (a.id !== aulaAtual.id) return a;
            return { ...a, avaliacao: rating };
          })
        };
      })
    );

    // 2. Persiste no Firestore
    try {
      await updateLessonRating(user.uid, aulaAtual.id, rating);
    } catch (err) {
      console.error('Falha ao salvar avaliação. Revertendo...', err);
      // Rollback
      setModulos((prevModulos) =>
        prevModulos.map((mod) => {
          if (mod.id !== moduloAtual?.id) return mod;
          return {
            ...mod,
            aulas: mod.aulas.map((a) => {
              if (a.id !== aulaAtual.id) return a;
              return { ...a, avaliacao: ratingAnterior };
            })
          };
        })
      );
    }
  };

  const handleSelectModuloFromGrid = (modId: string) => {
    const targetModule = modulos.find((m) => m.id === modId);
    if (targetModule && targetModule.aulas.length > 0) {
      setModuloAtualId(modId);
      const firstUncompleted = targetModule.aulas.find((a) => !a.concluida);
      setAulaAtualId(firstUncompleted ? firstUncompleted.id : targetModule.aulas[0].id);
      setViewMode('lesson');
    }
  };

  const handleSelectModuloFromSidebar = (modId: string) => {
    const targetModule = modulos.find((m) => m.id === modId);
    if (targetModule && targetModule.aulas.length > 0) {
      setModuloAtualId(modId);
      setAulaAtualId(targetModule.aulas[0].id);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setUser(null);
  };

  // Render Tela de Carregamento Inicial
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#040607]">
        <div className="adsata-bg-fixed" />
        <div className="relative z-10 w-full max-w-sm backdrop-blur-2xl bg-[#06120e]/65 border border-[#22E025]/35 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(34,224,37,0.18)] rounded-3xl p-8 text-center space-y-4">
          <div className="w-13 h-13 rounded-2xl bg-[#153A2D]/80 border border-[#22E025]/50 text-[#22E025] flex items-center justify-center mx-auto animate-spin shadow-[0_0_20px_rgba(34,224,37,0.35)]">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-xs font-mono font-bold text-[#22E025] tracking-wider uppercase">
            Acessando Área de Membros...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, exibe Modal de Login
  if (!user) {
    return (
      <LoginModal
        onLoginSuccess={() => setAuthError(null)}
        initialErrorMessage={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#040607] text-[#F3F4F6] font-sans antialiased flex flex-col selection:bg-[#22E025] selection:text-[#050E06] relative">
      <div className="adsata-bg-fixed" />

      {/* Cabecalho Autenticado */}
      <Cabecalho
        nomePlataforma="Área de Membros"
        nomeAluno={user.displayName || user.email?.split('@')[0] || (typeof window !== 'undefined' ? localStorage.getItem('userDirectEmail')?.split('@')[0] : null) || 'Carlos'}
        emailAluno={user.email || (typeof window !== 'undefined' ? localStorage.getItem('userDirectEmail') : null) || 'carlos@dominus.site'}
        onLogout={handleLogout}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
        isSidebarMobileOpen={isSidebarMobileOpen}
        onGoHome={() => setViewMode('home')}
      />

      {/* Corpo principal */}
      <main className="w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-10 py-6 flex-1 relative z-10">
        {viewMode === 'home' ? (
          <ModuloGrid
            modulos={modulos}
            onSelectModulo={handleSelectModuloFromGrid}
            loading={dataLoading}
          />
        ) : (
          <>
            {/* Barra de contexto */}
            {moduloAtual && aulaAtual && (
              <BarraContexto
                moduloAtual={moduloAtual}
                aulaAtual={aulaAtual}
                temAnterior={temAnterior}
                temProxima={temProxima}
                onAnterior={handleAnterior}
                onProxima={handleProxima}
                onVoltar={() => setViewMode('home')}
              />
            )}

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
              {/* Sidebar do Curso */}
              <div className="w-full lg:w-[32%] shrink-0">
                <SidebarCurso
                  modulos={modulos}
                  aulaAtualId={aulaAtualId}
                  moduloAtualId={moduloAtualId}
                  onSelectAula={(id) => setAulaAtualId(id)}
                  onSelectModulo={handleSelectModuloFromSidebar}
                  onGoHome={() => setViewMode('home')}
                  isMobileOpen={isSidebarMobileOpen}
                  onCloseMobile={() => setIsSidebarMobileOpen(false)}
                  loading={dataLoading}
                />
              </div>

              {/* Player + Informações da Aula */}
              <div className="w-full lg:w-[68%] flex-1 min-w-0">
                <div className="mb-5">
                  <Player aula={aulaAtual} loading={dataLoading} />
                </div>

                {aulaAtual && (
                  <>
                    <div className="flex items-center gap-1.5 text-[14px] text-[#9CA3AF] font-medium mb-2">
                      <Clock className="w-4 h-4 text-[#22E025]" />
                      <span>{aulaAtual.duracaoMin} min</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white leading-tight tracking-tight mb-2">
                          {aulaAtual.titulo}
                        </h1>
                        <p className="text-[14px] sm:text-[15px] text-[#9CA3AF] leading-relaxed font-normal">
                          {aulaAtual.descricao}
                        </p>
                      </div>

                      <CardAcao
                        concluida={aulaAtual.concluida || false}
                        avaliacao={aulaAtual.avaliacao || null}
                        onToggleConcluida={handleToggleConcluida}
                        onSetRating={handleSetRating}
                        loading={actionLoading}
                      />
                    </div>

                    {/* Material Anexo */}
                    {aulaAtual.materialAnexo && (
                      <div className="pt-2">
                        <a
                          href={aulaAtual.materialAnexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-[#0B0F10] border border-[#1E272B] text-[13px] font-medium text-white hover:border-[#22E025]/50 hover:text-[#22E025] transition-all duration-150 cursor-pointer shadow-sm group"
                        >
                          <div className="w-7 h-7 rounded-[8px] bg-[#153A2D] border border-[#22E025]/30 flex items-center justify-center text-[#22E025]">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span>{aulaAtual.materialAnexo.nome}</span>
                          <Download className="w-3.5 h-3.5 ml-1 text-[#9CA3AF] group-hover:text-[#22E025]" />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

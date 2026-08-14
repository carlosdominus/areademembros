import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Clock, FileText, Download } from 'lucide-react';
import { Modulo, Aula } from '../types';
import { updateLessonProgress, updateLessonRating } from '../lib/courseService';
import { Cabecalho } from './Cabecalho';
import { BarraContexto } from './BarraContexto';
import { Player } from './Player';
import { CardAcao } from './CardAcao';
import { SidebarCurso } from './SidebarCurso';
import { ModuloGrid } from './ModuloGrid';

interface AreaMembrosProps {
  user: User;
  modulos: Modulo[];
  dataLoading: boolean;
  onLogout: () => Promise<void>;
  onRefreshData?: () => Promise<void>;
}

export const AreaMembros: React.FC<AreaMembrosProps> = ({
  user,
  modulos: initialModulos,
  dataLoading,
  onLogout
}) => {
  const [modulos, setModulos] = useState<Modulo[]>(initialModulos);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'home' | 'lesson'>('home');
  const [moduloAtualId, setModuloAtualId] = useState<string>(() => initialModulos[0]?.id || '');
  const [aulaAtualId, setAulaAtualId] = useState<string>(() => initialModulos[0]?.aulas[0]?.id || '');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);

  // Sincroniza se os módulos mudarem externamente
  React.useEffect(() => {
    if (initialModulos.length > 0) {
      setModulos(initialModulos);
      if (!moduloAtualId) {
        setModuloAtualId(initialModulos[0].id);
        if (initialModulos[0].aulas.length > 0 && !aulaAtualId) {
          setAulaAtualId(initialModulos[0].aulas[0].id);
        }
      }
    }
  }, [initialModulos]);

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

  // Alteração com escrita otimista, timeout de 10s e rollback
  const handleToggleConcluida = async () => {
    if (!user || !aulaAtual) return;
    if (aulaAtual.concluida) return;

    const estadoAnterior = aulaAtual.concluida;
    const novoEstado = true;

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

    // 2. Persiste no Firestore com Promise.race de 10 segundos
    setActionLoading(true);
    try {
      await Promise.race([
        updateLessonProgress(user.uid, aulaAtual.id, novoEstado, aulaAtual.avaliacao),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
      ]);
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

  return (
    <div className="min-h-screen text-[#EDF4EB] font-body antialiased flex flex-col selection:bg-[#41F20A] selection:text-[#062800] relative">
      <div className="grao" />

      {/* Cabecalho Autenticado */}
      <Cabecalho
        nomePlataforma="Área de Membros"
        nomeAluno={user.displayName || user.email?.split('@')[0] || (typeof window !== 'undefined' ? localStorage.getItem('userDirectEmail')?.split('@')[0] : null) || 'Carlos'}
        emailAluno={user.email || (typeof window !== 'undefined' ? localStorage.getItem('userDirectEmail') : null) || 'carlos@dominus.site'}
        onLogout={onLogout}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
        isSidebarMobileOpen={isSidebarMobileOpen}
        onGoHome={() => setViewMode('home')}
      />

      {/* Corpo principal */}
      <main className="w-full max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 py-6 flex-1 relative z-10">
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
                    <div className="flex items-center gap-1.5 text-[14px] text-[#A7B7A4] font-medium mb-2">
                      <Clock className="w-4 h-4 text-[#41F20A]" />
                      <span>{aulaAtual.duracaoMin} min</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h1 className="font-display text-[26px] sm:text-[30px] text-[#EDF4EB] mb-2">
                          {aulaAtual.titulo}
                        </h1>
                        <p className="text-[14px] sm:text-[15px] text-[#D9E4D6] leading-relaxed font-normal">
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
                          className="btn-vidro h-[44px] px-4 rounded-[12px] text-[13px] font-medium text-[#EDF4EB] inline-flex items-center gap-2.5 cursor-pointer shadow-sm group"
                        >
                          <div className="w-7 h-7 rounded-[8px] bg-[rgba(65,242,10,0.08)] border border-[rgba(65,242,10,0.22)] flex items-center justify-center text-[#41F20A]">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span>{aulaAtual.materialAnexo.nome}</span>
                          <Download className="w-3.5 h-3.5 ml-1 text-[#A7B7A4] group-hover:text-[#41F20A]" />
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
};

export default AreaMembros;

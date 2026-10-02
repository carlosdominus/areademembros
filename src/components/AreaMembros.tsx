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
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'lesson'>('home');
  const [moduloAtualId, setModuloAtualId] = useState<string>(() => initialModulos[0]?.id || '');
  const [aulaAtualId, setAulaAtualId] = useState<string>(() => initialModulos[0]?.aulas[0]?.id || '');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);

  // Sincroniza se os módulos mudarem externamente, preservando o progresso concluído
  React.useEffect(() => {
    if (initialModulos.length > 0) {
      setModulos((prevModulos) => {
        // Mapa de progresso do estado atual para não perder marcações
        const estadoConcluidasMap = new Map<string, boolean>();
        const estadoAvaliacaoMap = new Map<string, number | null>();
        prevModulos.forEach((m) => {
          m.aulas.forEach((a) => {
            if (a.concluida) estadoConcluidasMap.set(a.id, true);
            if (a.avaliacao) estadoAvaliacaoMap.set(a.id, a.avaliacao);
          });
        });

        // Lê também do localStorage do usuário se existir, garantindo limpeza em aulas emBreve
        try {
          const raw = localStorage.getItem(`progresso_${user?.uid}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            let needsClean = false;
            Object.keys(parsed).forEach((k) => {
              if (parsed[k]?.concluida) estadoConcluidasMap.set(k, true);
              if (parsed[k]?.avaliacao) estadoAvaliacaoMap.set(k, parsed[k].avaliacao);
            });

            // Remove qualquer marcação anterior em aulas que são "Em Breve"
            initialModulos.forEach((m) => {
              const isModBloqueado = m.bloqueado || (m.ordem !== undefined && m.ordem >= 3);
              m.aulas.forEach((a) => {
                if (a.emBreve || !a.vturbEmbedId || isModBloqueado) {
                  estadoConcluidasMap.delete(a.id);
                  estadoAvaliacaoMap.delete(a.id);
                  if (parsed[a.id]) {
                    delete parsed[a.id];
                    needsClean = true;
                  }
                }
              });
            });

            if (needsClean) {
              localStorage.setItem(`progresso_${user?.uid}`, JSON.stringify(parsed));
            }
          }
        } catch {
          // ignore
        }

        return initialModulos.map((mod) => {
          const isModBloqueado = mod.bloqueado || (mod.ordem !== undefined && mod.ordem >= 3);
          return {
            ...mod,
            aulas: mod.aulas.map((aula) => {
              const isEmBreve = aula.emBreve || !aula.vturbEmbedId || isModBloqueado;
              if (isEmBreve) {
                return {
                  ...aula,
                  concluida: false,
                  avaliacao: null
                };
              }
              return {
                ...aula,
                concluida: estadoConcluidasMap.get(aula.id) ?? aula.concluida ?? false,
                avaliacao: estadoAvaliacaoMap.get(aula.id) ?? aula.avaliacao ?? null
              };
            })
          };
        });
      });

      if (!moduloAtualId) {
        setModuloAtualId(initialModulos[0].id);
        if (initialModulos[0].aulas.length > 0 && !aulaAtualId) {
          setAulaAtualId(initialModulos[0].aulas[0].id);
        }
      }
    }
  }, [initialModulos, user?.uid]);

  // Flatten de todas as aulas dos módulos desbloqueados
  const todasAulasFlat = useMemo(() => {
    const list: { modulo: Modulo; aula: Aula; indexGlobal: number }[] = [];
    let idx = 0;
    modulos.forEach((mod) => {
      if (mod.bloqueado || (mod.ordem !== undefined && mod.ordem >= 3)) return;
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
    // Não conclui automaticamente ao avançar; avança diretamente para a próxima aula
    if (temProxima) {
      const nextItem = todasAulasFlat[indexGlobalAtual + 1];
      setModuloAtualId(nextItem.modulo.id);
      setAulaAtualId(nextItem.aula.id);
    }
  };

  // Marcação exclusiva através do botão com escrita otimista e isolamento por aula
  const handleToggleConcluida = async () => {
    if (!user || !aulaAtual) return;

    // Impede marcar conclusão em aulas "Em breve", sem vídeo ou em módulos bloqueados
    const isEmBreve = aulaAtual.emBreve || !aulaAtual.vturbEmbedId || (moduloAtual?.ordem !== undefined && moduloAtual.ordem >= 3) || moduloAtual?.bloqueado;
    if (isEmBreve) return;

    const targetAulaId = aulaAtual.id;
    const targetModuloId = moduloAtual?.id;
    const novoEstado = !aulaAtual.concluida;

    // 1. Atualização Otimista imediata no estado React (alterna entre true e false)
    setModulos((prevModulos) =>
      prevModulos.map((mod) => {
        if (mod.id !== targetModuloId) return mod;
        return {
          ...mod,
          aulas: mod.aulas.map((a) => {
            if (a.id !== targetAulaId) return a;
            return { ...a, concluida: novoEstado };
          })
        };
      })
    );

    // 2. Persiste no Firestore e cache isolando o loading desta aula
    setSavingLessonId(targetAulaId);
    try {
      await updateLessonProgress(user.uid, targetAulaId, novoEstado, aulaAtual.avaliacao);
    } catch (err) {
      console.error('Falha ao sincronizar progresso no banco:', err);
    } finally {
      setSavingLessonId((current) => (current === targetAulaId ? null : current));
    }
  };

  const handleSetRating = async (rating: number) => {
    if (!user || !aulaAtual) return;

    // Não permite avaliação em aulas em breve
    const isEmBreve = aulaAtual.emBreve || !aulaAtual.vturbEmbedId || (moduloAtual?.ordem !== undefined && moduloAtual.ordem >= 3) || moduloAtual?.bloqueado;
    if (isEmBreve) return;

    const targetAulaId = aulaAtual.id;
    const targetModuloId = moduloAtual?.id;

    // 1. Atualização Otimista
    setModulos((prevModulos) =>
      prevModulos.map((mod) => {
        if (mod.id !== targetModuloId) return mod;
        return {
          ...mod,
          aulas: mod.aulas.map((a) => {
            if (a.id !== targetAulaId) return a;
            return { ...a, avaliacao: rating };
          })
        };
      })
    );

    // 2. Persiste no Firestore
    try {
      await updateLessonRating(user.uid, targetAulaId, rating);
    } catch (err) {
      console.error('Falha ao salvar avaliação:', err);
    }
  };

  const handleSelectModuloFromGrid = (modId: string) => {
    const targetModule = modulos.find((m) => m.id === modId);
    if (!targetModule || targetModule.bloqueado || (targetModule.ordem !== undefined && targetModule.ordem >= 3)) return;
    if (targetModule.aulas.length > 0) {
      setModuloAtualId(modId);
      const firstUncompleted = targetModule.aulas.find((a) => !a.concluida);
      setAulaAtualId(firstUncompleted ? firstUncompleted.id : targetModule.aulas[0].id);
      setViewMode('lesson');
    }
  };

  const handleSelectModuloFromSidebar = (modId: string) => {
    const targetModule = modulos.find((m) => m.id === modId);
    if (!targetModule || targetModule.bloqueado || (targetModule.ordem !== undefined && targetModule.ordem >= 3)) return;
    if (targetModule.aulas.length > 0) {
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
      <main className="w-full max-w-[1560px] mx-auto px-4 sm:px-8 lg:px-12 pt-3.5 pb-6 sm:py-6 flex-1 relative z-10">
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
              <div className="contents lg:block lg:w-[32%] shrink-0">
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
                <div className="mb-4 sm:mb-5">
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
                        loading={savingLessonId === aulaAtual.id}
                        emBreve={Boolean(
                          aulaAtual.emBreve ||
                            !aulaAtual.vturbEmbedId ||
                            (moduloAtual?.ordem !== undefined && moduloAtual.ordem >= 3) ||
                            moduloAtual?.bloqueado
                        )}
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

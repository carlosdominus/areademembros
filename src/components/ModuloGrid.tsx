import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Play, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Modulo } from '../types';

interface ModuloGridProps {
  modulos: Modulo[];
  onSelectModulo: (moduloId: string) => void;
  loading?: boolean;
}

export const ModuloGrid: React.FC<ModuloGridProps> = ({
  modulos,
  onSelectModulo,
  loading = false
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const [visibleEndIndex, setVisibleEndIndex] = useState<number>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 4
  );

  const updateScrollState = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const atStart = scrollLeft <= 8;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 12;

      setCanScrollLeft(!atStart);
      setCanScrollRight(!atEnd);

      const children = Array.from(carouselRef.current.children) as HTMLElement[];
      if (children.length > 0) {
        if (atEnd) {
          setVisibleEndIndex(children.length);
        } else {
          const firstCard = children[0];
          const cardWidth = firstCard.offsetWidth;
          const style = window.getComputedStyle(carouselRef.current);
          const gap = parseInt(style.gap || style.columnGap || '20', 10) || 20;

          // Number of whole cards fitting in visible container
          // Mobile (1.5 cards layout) = 1 full card; Tablet = 2; Desktop = 4
          const fullCardsInView = Math.max(1, Math.floor((clientWidth + gap * 1.15) / (cardWidth + gap)));

          // Scrolled cards offset
          const scrolledCards = Math.max(0, Math.floor((scrollLeft + (cardWidth + gap) * 0.35) / (cardWidth + gap)));

          const currentEnd = Math.min(children.length, fullCardsInView + scrolledCards);
          setVisibleEndIndex(Math.max(fullCardsInView, currentEnd));
        }
      }
    }
  }, [modulos.length]);

  useEffect(() => {
    updateScrollState();
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);
      const timer = setTimeout(updateScrollState, 150);
      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
        clearTimeout(timer);
      };
    }
  }, [modulos, updateScrollState]);

  // Calculate total course stats (apenas dos módulos disponíveis)
  const modulosDisponiveis = modulos.filter((m) => !m.bloqueado && (m.ordem === undefined || m.ordem < 6));
  const totalAulas = modulosDisponiveis.reduce((acc, m) => acc + m.aulas.length, 0);
  const aulasConcluidas = modulosDisponiveis.reduce(
    (acc, m) => acc + m.aulas.filter((a) => a.concluida).length,
    0
  );
  const progressoGeral = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    const firstCard = children[0];
    const cardWidth = firstCard.offsetWidth;
    const style = window.getComputedStyle(container);
    const gap = parseInt(style.gap || style.columnGap || '20', 10) || 20;

    // Determine how many whole cards are visible at once
    const fullCardsInView = Math.max(1, Math.floor((clientWidth + gap * 0.5) / (cardWidth + gap)));

    if (fullCardsInView > 1) {
      // Desktop / Tablet multi-card step
      const currentIndex = Math.max(0, Math.round(scrollLeft / (cardWidth + gap)));
      const targetIndex =
        direction === 'left'
          ? Math.max(0, currentIndex - fullCardsInView)
          : Math.min(children.length - fullCardsInView, currentIndex + fullCardsInView);

      const targetOffset = children[targetIndex]?.offsetLeft ?? 0;
      container.scrollTo({ left: targetOffset, behavior: 'smooth' });
    } else {
      // Mobile 1-by-1 card navigation
      if (direction === 'left') {
        const prevCard = [...children]
          .reverse()
          .find((child) => child.offsetLeft < scrollLeft - 10);
        if (prevCard) {
          container.scrollTo({ left: prevCard.offsetLeft, behavior: 'smooth' });
        } else {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        }
      } else {
        const nextCard = children.find((child) => child.offsetLeft > scrollLeft + 10);
        if (nextCard) {
          container.scrollTo({ left: nextCard.offsetLeft, behavior: 'smooth' });
        } else {
          container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        }
      }
    }

    setTimeout(updateScrollState, 350);
  };

  const handleCardClick = (modulo: Modulo) => {
    const isBloqueado = modulo.bloqueado || (modulo.ordem !== undefined && modulo.ordem >= 6);
    if (isBloqueado) {
      setLockedToast(`${modulo.titulo}: este módulo será liberado em breve!`);
      setTimeout(() => {
        setLockedToast(null);
      }, 3500);
      return;
    }
    onSelectModulo(modulo.id);
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[rgba(255,255,255,0.05)] rounded-lg" />
        <div className="flex gap-4 overflow-hidden py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[calc((100%-3*1.25rem)/4)] h-[420px] bg-[#0B110D] border border-[rgba(255,255,255,0.08)] rounded-[20px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 relative">
      {/* Toast de Módulo Bloqueado */}
      {lockedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className="vidro px-4 py-3 rounded-[14px] bg-[rgba(14,20,16,0.96)] border border-[rgba(255,255,255,0.18)] shadow-2xl flex items-center gap-3 text-[13.5px] text-[#EDF4EB]">
            <div className="w-7 h-7 rounded-[8px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] flex items-center justify-center text-[#A7B7A4] shrink-0">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span>{lockedToast}</span>
          </div>
        </div>
      )}

      {/* Top Header: Title + Overall Progress + Navigation Controls */}
      <div className="pb-2.5 sm:pb-3 border-b border-[rgba(255,255,255,0.08)]">
        {/* Linha 1: Título na esquerda & (Mobile: Badge 1/7 com largura exata de 72px / Desktop: Progresso Geral) */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[21px] sm:text-[28px] text-[#EDF4EB] tracking-tight leading-none">
            Módulos do Curso
          </h1>

          {/* Mobile: Marcador 1/7 alinhado no topo e com largura exata das duas setas (72px) */}
          <div
            className="flex sm:hidden w-[72px] h-[28px] rounded-[8px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[#D9E4D6] font-['Inter_Tight',sans-serif] text-[12px] font-semibold items-center justify-center gap-1 shadow-sm select-none shrink-0"
            title={`Exibindo até o módulo ${visibleEndIndex} de ${modulos.length}`}
          >
            <span className="text-[#41F20A] font-bold">{visibleEndIndex}</span>
            <span className="text-[#A7B7A4]">/</span>
            <span className="text-[#EDF4EB]">{modulos.length}</span>
          </div>

          {/* Desktop: Progresso Geral */}
          <div className="text-right hidden sm:block font-['Inter_Tight',sans-serif]">
            <span className="text-[12.5px] font-semibold text-[#D9E4D6] block">
              Progresso Geral: <strong className="text-[#41F20A] font-bold">{progressoGeral}%</strong>
            </span>
            <span className="text-[12px] text-[#A7B7A4]">
              {aulasConcluidas} de {totalAulas} aulas concluídas
            </span>
          </div>
        </div>

        {/* Linha 2: Subtítulo na esquerda & Controles de navegação na direita */}
        <div className="flex items-center justify-between gap-3 pt-1.5 sm:pt-2">
          <p className="font-['Inter_Tight',sans-serif] font-normal text-[12.5px] sm:text-[13.5px] text-[#A7B7A4] leading-snug">
            <span className="block sm:inline">Deslize para ver todos os módulos</span>{' '}
            <span className="block sm:inline">e selecionar o conteúdo</span>
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop: Marcador de Módulos (ex: 1 / 7) */}
            <div
              className="hidden sm:flex px-3 py-1.5 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[#D9E4D6] font-['Inter_Tight',sans-serif] text-[13px] font-semibold items-center justify-center gap-1 shadow-sm select-none"
              title={`Exibindo até o módulo ${visibleEndIndex} de ${modulos.length}`}
            >
              <span className="text-[#41F20A] font-bold">{visibleEndIndex}</span>
              <span className="text-[#A7B7A4]">/</span>
              <span className="text-[#EDF4EB]">{modulos.length}</span>
            </div>

            {/* Setas de Navegação: largura de 72px no mobile (32px + 8px gap + 32px) */}
            <div className="flex items-center gap-2 w-[72px] sm:w-auto justify-between">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] rounded-[9px] sm:rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm ${
                  !canScrollLeft
                    ? 'opacity-30 cursor-not-allowed text-[#A7B7A4]'
                    : 'hover:border-[#41F20A]/50 text-[#EDF4EB] hover:text-[#41F20A]'
                }`}
                title="Anterior"
                aria-label="Módulos anteriores"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] rounded-[9px] sm:rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm ${
                  !canScrollRight
                    ? 'opacity-30 cursor-not-allowed text-[#A7B7A4]'
                    : 'hover:border-[#41F20A]/50 text-[#EDF4EB] hover:text-[#41F20A]'
                }`}
                title="Próximo"
                aria-label="Próximos módulos"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Image Carousel Slider */}
      <div className="relative group">
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pt-3 pb-8 snap-x snap-mandatory scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {modulos.map((modulo) => {
            const isBloqueado = modulo.bloqueado || (modulo.ordem !== undefined && modulo.ordem >= 6);
            const totalM = modulo.aulas.length;
            const concluidasM = modulo.aulas.filter((a) => a.concluida).length;
            const pctM = totalM > 0 ? Math.round((concluidasM / totalM) * 100) : 0;
            const totalMin = modulo.aulas.reduce((acc, a) => acc + a.duracaoMin, 0);

            return (
              <div
                key={modulo.id}
                onClick={() => handleCardClick(modulo)}
                className={`card-modulo snap-start shrink-0 w-[58vw] max-w-[240px] sm:max-w-none sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] group/card relative rounded-[20px] flex flex-col ${
                  isBloqueado ? 'cursor-pointer opacity-90' : 'cursor-pointer'
                }`}
              >
                {/* Vertical Poster Cover (3:4 aspect ratio) */}
                <div className="capa bg-[#080D0A]">
                  <img
                    src={modulo.capaUrl || `https://membros.dominus.site/images/m${modulo.ordem + 1}_converted.webp?v=2`}
                    alt={modulo.titulo}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = `https://membros.dominus.site/images/m${modulo.ordem + 1}_converted.webp?v=2`;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                    className={`w-full h-full object-cover select-none ${
                      isBloqueado ? 'brightness-90 contrast-[0.95]' : ''
                    }`}
                  />

                  {/* Minimalist Lock / Status Badge */}
                  {isBloqueado ? (
                    <div className="absolute top-3 right-3 bg-[rgba(10,15,12,0.85)] border border-[rgba(255,255,255,0.15)] text-[#EDF4EB] px-2.5 py-1 rounded-[8px] text-[11px] font-medium font-['Inter_Tight',sans-serif] flex items-center gap-1.5 shadow-lg backdrop-blur-md z-10 select-none">
                      <Lock className="w-3 h-3 text-[#A7B7A4]" />
                      <span>Em breve</span>
                    </div>
                  ) : pctM === 100 ? (
                    <div className="absolute top-3 right-3 bg-[rgba(10,15,12,0.85)] border border-[rgba(255,255,255,0.15)] text-[#EDF4EB] px-2.5 py-1 rounded-[8px] text-[11px] font-medium font-['Inter_Tight',sans-serif] flex items-center gap-1.5 shadow-lg backdrop-blur-md z-10 select-none">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#A7B7A4]" />
                      <span>Concluído</span>
                    </div>
                  ) : null}

                  {/* Hover State */}
                  {isBloqueado ? (
                    <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none bg-black/45 backdrop-blur-[2px]">
                      <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] text-[#D9E4D6] flex items-center justify-center shadow-lg">
                        <Lock className="w-5 h-5 text-[#A7B7A4]" />
                      </div>
                      <span className="text-[11.5px] font-medium text-[#EDF4EB] bg-black/70 px-2.5 py-0.5 rounded-full border border-white/10">
                        Em breve
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 pointer-events-none">
                      <div
                        style={{
                          background: 'linear-gradient(180deg, #7BFA45 0%, #41F20A 46%, #2BB102 64%, #1A8300 100%)'
                        }}
                        className="w-14 h-14 rounded-full text-[#062800] flex items-center justify-center font-bold shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
                      >
                        <Play className="w-7 h-7 fill-current ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Info Details */}
                <div className="p-4 flex-1 flex flex-col justify-between rounded-b-[20px]">
                  <div>
                    <h3 className={`font-['Inter_Tight',sans-serif] font-semibold text-[15px] transition-colors leading-tight line-clamp-1 ${
                      isBloqueado ? 'text-[#D9E4D6] group-hover/card:text-[#EDF4EB]' : 'text-[#EDF4EB] group-hover/card:text-[#41F20A]'
                    }`}>
                      {modulo.titulo}
                    </h3>
                    <p className="font-['Inter_Tight',sans-serif] font-normal text-[12.5px] text-[#A7B7A4] mt-1">
                      {totalM} aula{totalM !== 1 ? 's' : ''} • {totalMin} min
                    </p>
                  </div>

                  {/* Progress Bar / Locked Status Bar */}
                  {isBloqueado ? (
                    <div className="mt-3.5 pt-2.5 border-t border-[rgba(255,255,255,0.08)]">
                      <div className="flex items-center justify-between text-[11.5px] font-['Inter_Tight',sans-serif] font-medium text-[#A7B7A4]">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-[#A7B7A4]" />
                          <span>Bloqueado</span>
                        </span>
                        <span className="text-[#A7B7A4] font-medium text-[11px]">
                          Em breve
                        </span>
                      </div>
                      <div className="w-full h-[4px] bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mt-1.5" />
                    </div>
                  ) : (
                    <div className="mt-3.5 pt-2.5 border-t border-[rgba(255,255,255,0.08)]">
                      <div className="flex items-center justify-between text-[11.5px] font-['Inter_Tight',sans-serif] font-medium mb-1.5 text-[#D9E4D6]">
                        <span>{concluidasM} de {totalM} aulas concluídas</span>
                        <span className={pctM > 0 ? 'text-[#41F20A] font-bold' : 'text-[#D9E4D6]'}>
                          {pctM}%
                        </span>
                      </div>
                      <div className="w-full h-[4px] bg-[rgba(255,255,255,0.09)] rounded-full overflow-hidden">
                        {pctM > 0 && (
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pctM}%`,
                              background: 'linear-gradient(90deg, #2BB102, #41F20A)'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

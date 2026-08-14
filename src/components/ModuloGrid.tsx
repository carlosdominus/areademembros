import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [visibleEndIndex, setVisibleEndIndex] = useState<number>(4);

  const updateScrollState = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const atStart = scrollLeft <= 10;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 15;

      setCanScrollLeft(!atStart);
      setCanScrollRight(!atEnd);
      setIsAtEnd(atEnd);

      const children = Array.from(carouselRef.current.children) as HTMLElement[];
      if (children.length > 0) {
        if (atEnd) {
          setVisibleEndIndex(children.length);
        } else if (atStart) {
          const firstCard = children[0];
          const cardWidth = firstCard.offsetWidth;
          const style = window.getComputedStyle(carouselRef.current);
          const gap = parseInt(style.gap || style.columnGap || '20', 10) || 20;
          // Calculate whole cards visible in container
          const fitCount = Math.min(
            children.length,
            Math.max(1, Math.round((clientWidth + gap) / (cardWidth + gap)))
          );
          setVisibleEndIndex(fitCount);
        } else {
          // Dynamic calculation based on rightmost visible card
          let maxVisibleIndex = 1;
          const viewRight = scrollLeft + clientWidth;
          children.forEach((child, index) => {
            const childLeft = child.offsetLeft;
            const childWidth = child.offsetWidth;
            if (childLeft + childWidth * 0.25 <= viewRight && childLeft + childWidth * 0.75 >= scrollLeft) {
              maxVisibleIndex = index + 1;
            }
          });
          setVisibleEndIndex(Math.min(children.length, Math.max(1, maxVisibleIndex)));
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

  // Calculate total course stats
  const totalAulas = modulos.reduce((acc, m) => acc + m.aulas.length, 0);
  const aulasConcluidas = modulos.reduce(
    (acc, m) => acc + m.aulas.filter((a) => a.concluida).length,
    0
  );
  const progressoGeral = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const firstCard = carouselRef.current.firstElementChild as HTMLElement;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const style = window.getComputedStyle(carouselRef.current);
        const gap = parseInt(style.gap || style.columnGap || '20', 10) || 20;
        const clientWidth = carouselRef.current.clientWidth;
        const cardsInView = Math.max(1, Math.floor((clientWidth + gap * 0.5) / (cardWidth + gap)));
        const scrollAmount = cardsInView > 1 ? (cardWidth + gap) * cardsInView : (cardWidth + gap);

        carouselRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      } else {
        carouselRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
      }
      setTimeout(updateScrollState, 350);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[rgba(255,255,255,0.05)] rounded-lg" />
        <div className="flex gap-4 overflow-hidden py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[calc((100%-3*1.25rem)/4)] h-[420px] vidro rounded-[20px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Header: Title + Overall Progress + Navigation Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <h1 className="font-display text-[24px] sm:text-[28px] text-[#EDF4EB]">
            Módulos do Curso
          </h1>
          <p className="font-['Inter_Tight',sans-serif] font-normal text-[13.5px] text-[#A7B7A4] mt-1">
            Deslize para ver todos os módulos e selecionar o conteúdo
          </p>
        </div>

        {/* Carousel Controls & Progress */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right hidden md:block font-['Inter_Tight',sans-serif]">
            <span className="text-[12.5px] font-semibold text-[#D9E4D6] block">
              Progresso Geral: <strong className="text-[#41F20A] font-bold">{progressoGeral}%</strong>
            </span>
            <span className="text-[12px] text-[#A7B7A4]">
              {aulasConcluidas} de {totalAulas} aulas concluídas
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Marcador de Módulos (ex: 4 / 7) */}
            <div
              className="px-3 py-1.5 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[#D9E4D6] font-['Inter_Tight',sans-serif] text-[13px] font-semibold flex items-center gap-1 shadow-sm select-none"
              title={`Exibindo até o módulo ${visibleEndIndex} de ${modulos.length}`}
            >
              <span className="text-[#41F20A] font-bold">{visibleEndIndex}</span>
              <span className="text-[#A7B7A4]">/</span>
              <span className="text-[#EDF4EB]">{modulos.length}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-[38px] h-[38px] rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm ${
                  !canScrollLeft
                    ? 'opacity-30 cursor-not-allowed text-[#A7B7A4]'
                    : 'hover:border-[#41F20A]/50 text-[#EDF4EB] hover:text-[#41F20A]'
                }`}
                title="Anterior"
                aria-label="Módulos anteriores"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-[38px] h-[38px] rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm ${
                  !canScrollRight
                    ? 'opacity-30 cursor-not-allowed text-[#A7B7A4]'
                    : 'hover:border-[#41F20A]/50 text-[#EDF4EB] hover:text-[#41F20A]'
                }`}
                title="Próximo"
                aria-label="Próximos módulos"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Image Carousel Slider with Mobile Degrade Fade on cut edges */}
      <div className="relative group">
        {/* Mobile Left Fade Gradient: suaviza o corte do módulo anterior APENAS quando chegar no final (ex: módulo 7) */}
        <div
          aria-hidden="true"
          className={`sm:hidden absolute left-0 top-0 bottom-0 w-20 z-20 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-black via-black/85 to-transparent ${
            isAtEnd ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Mobile Right Fade Gradient: suaviza o corte do módulo seguinte até chegar no último módulo */}
        <div
          aria-hidden="true"
          className={`sm:hidden absolute right-0 top-0 bottom-0 w-20 z-20 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-black via-black/85 to-transparent ${
            !isAtEnd ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pt-4 pb-12 snap-x snap-mandatory scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {modulos.map((modulo) => {
            const totalM = modulo.aulas.length;
            const concluidasM = modulo.aulas.filter((a) => a.concluida).length;
            const pctM = totalM > 0 ? Math.round((concluidasM / totalM) * 100) : 0;
            const totalMin = modulo.aulas.reduce((acc, a) => acc + a.duracaoMin, 0);

            return (
              <div
                key={modulo.id}
                onClick={() => onSelectModulo(modulo.id)}
                className="card-modulo snap-start shrink-0 w-[80vw] max-w-[300px] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2*1.25rem)/3)] lg:w-[calc((100%-3*1.25rem)/4)] group/card relative vidro rounded-[20px] cursor-pointer flex flex-col"
              >
                {/* Vertical Poster Cover (3:4 aspect ratio) */}
                <div className="capa bg-[#080D0A]">
                  {modulo.capaUrl ? (
                    <img
                      src={modulo.capaUrl}
                      alt={modulo.titulo}
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#080D0A] to-[rgba(26,131,0,0.2)]">
                      <div className="titulo">{modulo.titulo}</div>
                    </div>
                  )}

                  {/* Completed Badge */}
                  {pctM === 100 && (
                    <div className="absolute top-3 right-3 bg-[#41F20A] text-[#062800] px-2.5 py-1 rounded-[6px] text-[10px] font-bold font-['Inter_Tight',sans-serif] flex items-center gap-1 shadow-md z-10">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      <span>CONCLUÍDO</span>
                    </div>
                  )}

                  {/* Hover Play Button (sem escurecer a imagem) */}
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
                </div>

                {/* Card Info Details */}
                <div className="p-4 flex-1 flex flex-col justify-between rounded-b-[20px]">
                  <div>
                    <h3 className="font-['Inter_Tight',sans-serif] font-semibold text-[15px] text-[#EDF4EB] group-hover/card:text-[#41F20A] transition-colors leading-tight line-clamp-1">
                      {modulo.titulo}
                    </h3>
                    <p className="font-['Inter_Tight',sans-serif] font-normal text-[12.5px] text-[#A7B7A4] mt-1">
                      {totalM} aula{totalM !== 1 ? 's' : ''} • {totalMin} min
                    </p>
                  </div>

                  {/* Progress Bar (0% state leaves track only, non-green) */}
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

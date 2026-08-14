import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const updateScrollState = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
    }
  }, []);

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
        const scrollAmount = cardWidth + gap;
        carouselRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      } else {
        carouselRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
      }
      setTimeout(updateScrollState, 400);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[rgba(255,255,255,0.05)] rounded-lg" />
        <div className="flex gap-4 overflow-hidden py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[300px] h-[420px] vidro rounded-[20px] shrink-0" />
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] hover:border-[#41F20A]/50 text-[#EDF4EB] hover:text-[#41F20A] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Anterior"
              aria-label="Módulos anteriores"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] hover:border-[#41F20A]/50 text-[#EDF4EB] hover:text-[#41F20A] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Próximo"
              aria-label="Próximos módulos"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Image Carousel Slider (Without harsh mask, with generous padding for smooth shadow dissipation) */}
      <div className="relative group -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pt-4 pb-12 px-2 sm:px-4 snap-x snap-mandatory scroll-smooth"
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
                className="card-modulo snap-start shrink-0 w-[270px] sm:w-[305px] md:w-[325px] lg:w-[340px] xl:w-[350px] group/card relative vidro rounded-[20px] cursor-pointer flex flex-col"
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

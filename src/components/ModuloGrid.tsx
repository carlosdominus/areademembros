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

  const getMaskStyle = () => {
    if (canScrollRight) {
      return 'linear-gradient(to right, #000 0%, #000 calc(100% - 130px), transparent 100%)';
    }
    if (canScrollLeft) {
      return 'linear-gradient(to right, transparent 0px, #000 130px, #000 100%)';
    }
    return 'none';
  };

  const currentMask = getMaskStyle();

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[#1E272B] rounded-lg" />
        <div className="flex gap-4 overflow-hidden py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[300px] h-[420px] bg-[#0B0F10] border border-[#1E272B] rounded-[16px] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Header: Title + Overall Progress + Navigation Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E272B]">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#22E025]" />
            <span>Módulos do Curso</span>
          </h1>
          <p className="text-[13px] text-[#9CA3AF] mt-0.5">
            Deslize para ver todos os módulos e selecionar o conteúdo
          </p>
        </div>

        {/* Carousel Controls & Progress */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right hidden md:block">
            <span className="text-[12px] font-semibold text-[#9CA3AF] block">
              Progresso Geral: <strong className="text-[#22E025]">{progressoGeral}%</strong>
            </span>
            <span className="text-[11px] text-[#9CA3AF]">
              {aulasConcluidas} de {totalAulas} aulas concluídas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-[10px] bg-[#0B0F10] border border-[#1E272B] hover:border-[#22E025]/50 text-white hover:text-[#22E025] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              title="Anterior"
              aria-label="Módulos anteriores"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-[10px] bg-[#0B0F10] border border-[#1E272B] hover:border-[#22E025]/50 text-white hover:text-[#22E025] flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              title="Próximo"
              aria-label="Próximos módulos"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Image Carousel Slider */}
      <div className="relative group">
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-6 px-2 sm:px-3 snap-x snap-mandatory scroll-smooth transition-[mask-image]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitMaskImage: currentMask,
            maskImage: currentMask
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
                className="snap-start shrink-0 w-[270px] sm:w-[305px] md:w-[325px] lg:w-[340px] xl:w-[350px] group/card relative rounded-[16px] bg-[#0B0F10] border border-[#1E272B] hover:border-[#22E025] transition-colors duration-200 cursor-pointer flex flex-col hover:-translate-y-1.5 shadow-lg"
              >
                {/* Vertical Poster Cover (3:4 aspect ratio) */}
                <div className="relative aspect-[3/4] w-full bg-[#111517] rounded-t-[15px] overflow-hidden">
                  {modulo.capaUrl ? (
                    <img
                      src={modulo.capaUrl}
                      alt={modulo.titulo}
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111517] to-[#153A2D]/40">
                      <BookOpen className="w-12 h-12 text-[#22E025]/40" />
                    </div>
                  )}

                  {/* Completed Badge */}
                  {pctM === 100 && (
                    <div className="absolute top-3 right-3 bg-[#22E025] text-[#050E06] px-2.5 py-1 rounded-[6px] text-[10px] font-extrabold flex items-center gap-1 shadow-md z-10">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                      <span>CONCLUÍDO</span>
                    </div>
                  )}

                  {/* Hover Play Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <div className="w-14 h-14 rounded-full bg-[#22E025] text-[#050E06] flex items-center justify-center font-bold shadow-lg transform scale-90 group-hover/card:scale-100 transition-transform">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                  </div>
                </div>

                {/* Card Info Details */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-[#0B0F10] rounded-b-[15px]">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-white group-hover/card:text-[#22E025] transition-colors leading-snug line-clamp-1">
                      {modulo.titulo}
                    </h3>
                    <p className="text-[13px] text-[#9CA3AF] font-medium mt-1">
                      {totalM} aula{totalM !== 1 ? 's' : ''} • {totalMin} min
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3.5 pt-2.5 border-t border-[#1E272B]">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1 text-[#9CA3AF]">
                      <span>Progresso</span>
                      <span className={pctM > 0 ? 'text-[#22E025] font-bold' : ''}>
                        {pctM}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1E272B] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#22E025] rounded-full transition-all duration-300"
                        style={{ width: `${pctM}%` }}
                      />
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

import React from 'react';
import { Check } from 'lucide-react';
import { Aula } from '../types';

interface ItemAulaProps {
  aula: Aula;
  isAtual: boolean;
  isProximaConcluida?: boolean;
  isUltimaDoModulo: boolean;
  onSelectAula: (aulaId: string) => void;
}

export const ItemAula: React.FC<ItemAulaProps> = ({
  aula,
  isAtual,
  onSelectAula
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelectAula(aula.id)}
      className={`aula w-full text-left cursor-pointer focus-visible:outline-none ${
        isAtual ? 'ativa' : ''
      }`}
    >
      {/* Marcador Circular da Aula */}
      <div className="shrink-0">
        {aula.concluida ? (
          <div className="w-[18px] h-[18px] rounded-full bg-[#41F20A] text-[#062800] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(65,242,10,0.5)]">
            <Check className="w-[10px] h-[10px] stroke-[3.5]" />
          </div>
        ) : (
          <div
            className={`w-[18px] h-[18px] rounded-full border bg-black flex items-center justify-center transition-colors ${
              isAtual
                ? 'border-[#41F20A] bg-[rgba(65,242,10,0.15)] shadow-[0_0_10px_rgba(65,242,10,0.4)]'
                : 'border-[rgba(255,255,255,0.18)]'
            }`}
          />
        )}
      </div>

      {/* Título da Aula */}
      <span className="truncate flex-1 font-['Inter_Tight',sans-serif] leading-snug">
        {aula.titulo}
      </span>

      {/* Duração */}
      {aula.duracaoMin && (
        <span className="text-[11.5px] text-[#A7B7A4] shrink-0 font-normal">
          {aula.duracaoMin} min
        </span>
      )}
    </button>
  );
};


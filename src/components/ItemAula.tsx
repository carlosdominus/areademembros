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
  isProximaConcluida = false,
  isUltimaDoModulo,
  onSelectAula
}) => {
  return (
    <div className="relative flex items-center gap-3 py-1.5 px-1.5 group rounded-[10px] transition-colors duration-150">
      {/* Linha vertical de conexão (Trilha de Progresso) */}
      {!isUltimaDoModulo && (
        <span
          className={`absolute left-[15px] top-6 bottom-0 w-[2px] transition-colors ${
            aula.concluida && isProximaConcluida
              ? 'bg-[#41F20A]'
              : 'bg-[rgba(255,255,255,0.11)]'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Marcador Circular da Aula */}
      <div className="relative z-10 shrink-0">
        {aula.concluida ? (
          <div className="w-[18px] h-[18px] rounded-full bg-[#41F20A] text-[#062800] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(65,242,10,0.5)]">
            <Check className="w-[10px] h-[10px] stroke-[3.5]" />
          </div>
        ) : (
          <div className={`w-[18px] h-[18px] rounded-full border bg-black flex items-center justify-center group-hover:border-[#41F20A] transition-colors ${
            isAtual ? 'border-[#41F20A] bg-[rgba(65,242,10,0.15)] shadow-[0_0_10px_rgba(65,242,10,0.4)]' : 'border-[rgba(255,255,255,0.15)]'
          }`} />
        )}
      </div>

      {/* Item Clicável da Aula */}
      <button
        onClick={() => onSelectAula(aula.id)}
        className={`w-full text-left py-1.5 px-2.5 rounded-[8px] transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 min-h-[34px] font-['Inter_Tight',sans-serif] ${
          isAtual
            ? 'bg-[rgba(65,242,10,0.12)] text-[#EDF4EB] font-semibold border border-[rgba(65,242,10,0.30)]'
            : 'text-[#A7B7A4] hover:text-[#EDF4EB] hover:bg-[rgba(255,255,255,0.05)] font-normal'
        }`}
      >
        <span className="text-[13px] line-clamp-1 leading-snug">
          {aula.titulo}
        </span>
      </button>
    </div>
  );
};

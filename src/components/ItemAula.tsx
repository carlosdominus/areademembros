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
              ? 'bg-[#22E025]'
              : 'bg-[#1E272B]'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Marcador Circular da Aula */}
      <div className="relative z-10 shrink-0">
        {aula.concluida ? (
          <div className="w-[18px] h-[18px] rounded-full bg-[#22E025] text-[#050E06] flex items-center justify-center font-extrabold shadow-[0_0_10px_rgba(34,224,37,0.5)]">
            <Check className="w-[10px] h-[10px] stroke-[3.5]" />
          </div>
        ) : (
          <div className={`w-[18px] h-[18px] rounded-full border bg-[#0B0F10] flex items-center justify-center group-hover:border-[#22E025] transition-colors ${
            isAtual ? 'border-[#22E025] bg-[#153A2D] shadow-[0_0_10px_rgba(34,224,37,0.4)]' : 'border-[#1E272B]'
          }`} />
        )}
      </div>

      {/* Item Clicável da Aula */}
      <button
        onClick={() => onSelectAula(aula.id)}
        className={`w-full text-left py-1.5 px-2.5 rounded-[8px] transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 min-h-[34px] ${
          isAtual
            ? 'bg-[#153A2D] text-white font-bold border border-[#22E025]/40 shadow-sm'
            : 'text-[#9CA3AF] hover:text-white hover:bg-[#153A2D]/30 font-medium'
        }`}
      >
        <span className="text-[13px] line-clamp-1 leading-snug">
          {aula.titulo}
        </span>
      </button>
    </div>
  );
};

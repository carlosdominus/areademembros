import React from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modulo, Aula } from '../types';

interface BarraContextoProps {
  moduloAtual: Modulo;
  aulaAtual: Aula;
  temAnterior: boolean;
  temProxima: boolean;
  onAnterior: () => void;
  onProxima: () => void;
  onVoltar?: () => void;
}

export const BarraContexto: React.FC<BarraContextoProps> = ({
  moduloAtual,
  aulaAtual,
  temAnterior,
  temProxima,
  onAnterior,
  onProxima,
  onVoltar
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-3 mb-5 flex-wrap sm:flex-nowrap">
      {/* Esquerda: Botão "Voltar" + Ícone Livro + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Botão Voltar */}
        <button
          onClick={onVoltar}
          className="h-[36px] px-3.5 rounded-[10px] bg-[#0B0F10] border border-[#1E272B] hover:border-[#22E025]/50 text-[#22E025] font-semibold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
          title="Voltar para os Módulos"
        >
          <ArrowLeft className="w-4 h-4 text-[#22E025]" />
          <span>Módulos</span>
        </button>

        {/* Ícone Livro + Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] font-medium min-w-0 truncate">
          <BookOpen className="w-4 h-4 text-[#22E025] shrink-0" />
          <span className="text-white font-bold truncate">
            {moduloAtual.titulo}
          </span>
          <span className="text-[#9CA3AF] shrink-0">/</span>
          <span className="text-[#9CA3AF] font-normal truncate">
            {aulaAtual.titulo}
          </span>
        </div>
      </div>

      {/* Direita: Botões "Anterior" / "Próxima" */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAnterior}
          disabled={!temAnterior}
          className={`h-[36px] px-3.5 rounded-[10px] bg-[#0B0F10] border border-[#1E272B] text-white font-semibold text-[13px] flex items-center gap-1.5 transition-all shadow-sm ${
            !temAnterior 
              ? 'opacity-40 cursor-not-allowed border-[#1E272B]' 
              : 'hover:border-[#22E025]/50 hover:text-[#22E025] cursor-pointer'
          }`}
          title="Aula Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <button
          onClick={onProxima}
          disabled={!temProxima}
          className={`h-[36px] px-3.5 rounded-[10px] bg-[#0B0F10] border border-[#1E272B] text-white font-semibold text-[13px] flex items-center gap-1.5 transition-all shadow-sm ${
            !temProxima 
              ? 'opacity-40 cursor-not-allowed border-[#1E272B]' 
              : 'hover:border-[#22E025]/50 hover:text-[#22E025] cursor-pointer'
          }`}
          title="Próxima Aula"
        >
          <span>Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


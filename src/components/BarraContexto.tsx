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
      {/* Esquerda: Botão "Módulos" + Breadcrumb (sem ícone de livro) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Botão Voltar */}
        <button
          onClick={onVoltar}
          className="btn-vidro h-[40px] px-4 text-[#41F20A] font-['Inter_Tight',sans-serif] font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shrink-0"
          title="Voltar para os Módulos"
        >
          <ArrowLeft className="w-4 h-4 text-[#41F20A]" />
          <span>Módulos</span>
        </button>

        {/* Breadcrumb puro (sem ícone) */}
        <div className="flex items-center gap-2 text-[13.5px] font-['Inter_Tight',sans-serif] min-w-0 truncate">
          <span className="text-[#EDF4EB] font-semibold truncate">
            {moduloAtual.titulo}
          </span>
          <span className="text-[#A7B7A4] shrink-0">/</span>
          <span className="text-[#D9E4D6] font-normal truncate">
            {aulaAtual.titulo}
          </span>
        </div>
      </div>

      {/* Direita: Botões "Anterior" / "Próxima" */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAnterior}
          disabled={!temAnterior}
          className={`btn-vidro h-[40px] px-3.5 text-[13px] font-['Inter_Tight',sans-serif] font-medium flex items-center gap-1.5 transition-all ${
            !temAnterior 
              ? 'opacity-40 cursor-not-allowed' 
              : 'hover:text-[#41F20A] cursor-pointer'
          }`}
          title="Aula Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <button
          onClick={onProxima}
          disabled={!temProxima}
          className={`btn-vidro h-[40px] px-3.5 text-[13px] font-['Inter_Tight',sans-serif] font-medium flex items-center gap-1.5 transition-all ${
            !temProxima 
              ? 'opacity-40 cursor-not-allowed' 
              : 'hover:text-[#41F20A] cursor-pointer'
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


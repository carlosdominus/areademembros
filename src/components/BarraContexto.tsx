import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="w-full flex flex-col gap-2.5 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-5">
      {/* Barra de Ações Superior (No mobile: Módulos à esquerda e Navegação à direita) */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto min-w-0">
        {/* Botão Voltar para os Módulos */}
        <button
          onClick={onVoltar}
          className="btn-vidro h-[40px] px-3.5 sm:px-4 text-[#41F20A] hover:bg-[rgba(65,242,10,0.12)] font-['Inter_Tight',sans-serif] font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shrink-0"
          title="Voltar para os Módulos"
        >
          <ArrowLeft className="w-4 h-4 text-[#41F20A]" />
          <span>Módulos</span>
        </button>

        {/* Breadcrumb visível no Desktop */}
        <div className="hidden sm:flex items-center gap-2 text-[13.5px] font-['Inter_Tight',sans-serif] min-w-0 truncate ml-1">
          <span className="text-[#EDF4EB] font-semibold truncate">
            {moduloAtual.titulo}
          </span>
          <span className="text-[#A7B7A4] shrink-0">/</span>
          <span className="text-[#D9E4D6] font-normal truncate">
            {aulaAtual.titulo}
          </span>
        </div>

        {/* Controles Anterior / Próxima no Mobile (espaçados na extremidade direita) */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={onAnterior}
            disabled={!temAnterior}
            className={`btn-vidro h-[40px] px-3 text-[12.5px] font-['Inter_Tight',sans-serif] font-medium flex items-center gap-1 transition-all ${
              !temAnterior 
                ? 'opacity-35 cursor-not-allowed' 
                : 'hover:text-[#41F20A] active:scale-95 cursor-pointer'
            }`}
            title="Aula Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            onClick={onProxima}
            disabled={!temProxima}
            className={`btn-vidro h-[40px] px-3 text-[12.5px] font-['Inter_Tight',sans-serif] font-medium flex items-center gap-1 transition-all ${
              !temProxima 
                ? 'opacity-35 cursor-not-allowed' 
                : 'hover:text-[#41F20A] active:scale-95 cursor-pointer'
            }`}
            title="Próxima Aula"
          >
            <span>Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Direita no Desktop: Botões "Anterior" / "Próxima" */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <button
          onClick={onAnterior}
          disabled={!temAnterior}
          className={`btn-vidro h-[40px] px-3.5 text-[13px] font-['Inter_Tight',sans-serif] font-medium flex items-center gap-1.5 transition-all ${
            !temAnterior 
              ? 'opacity-40 cursor-not-allowed' 
              : 'hover:text-[#41F20A] active:scale-95 cursor-pointer'
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
              : 'hover:text-[#41F20A] active:scale-95 cursor-pointer'
          }`}
          title="Próxima Aula"
        >
          <span>Próxima</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Breadcrumb sutil no Mobile abaixo da barra de botões */}
      <div className="flex sm:hidden items-center gap-1.5 text-[12px] font-['Inter_Tight',sans-serif] text-[#8E9F8B] px-1 truncate">
        <span className="truncate max-w-[45%] font-medium text-[#A7B7A4]">{moduloAtual.titulo}</span>
        <span className="shrink-0 text-[#556453]">/</span>
        <span className="truncate max-w-[50%] text-[#D9E4D6]">{aulaAtual.titulo}</span>
      </div>
    </div>
  );
};



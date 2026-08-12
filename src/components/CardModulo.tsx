import React from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Modulo } from '../types';
import { ItemAula } from './ItemAula';

interface CardModuloProps {
  modulo: Modulo;
  isOpen: boolean;
  aulaAtualId: string;
  onToggleAccordion: (moduloId: string) => void;
  onSelectAula: (aulaId: string) => void;
}

export const CardModulo: React.FC<CardModuloProps> = ({
  modulo,
  isOpen,
  aulaAtualId,
  onToggleAccordion,
  onSelectAula
}) => {
  const todasConcluidas = modulo.aulas.length > 0 && modulo.aulas.every((a) => a.concluida);

  return (
    <div className="adsata-card overflow-hidden transition-all duration-150">
      {/* Cabeçalho de cada módulo (linha clicável, expande/colapsa) */}
      <button
        onClick={() => onToggleAccordion(modulo.id)}
        className="w-full min-h-[56px] p-4 text-left flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer focus-visible:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Badge numerado à esquerda: #153A2D, texto #22E025 font-bold */}
          <div className="w-[32px] h-[32px] rounded-[10px] bg-[#153A2D] border border-[#22E025]/30 text-[#22E025] font-extrabold text-[14px] flex items-center justify-center shrink-0">
            {modulo.ordem}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
                className={`text-[15px] font-bold tracking-tight truncate ${
                  isOpen || modulo.aulas.some((a) => a.id === aulaAtualId)
                    ? 'text-white'
                    : 'text-[#9CA3AF]'
                }`}
              >
                {modulo.titulo}
              </h4>
              {todasConcluidas && (
                <CheckCircle2 className="w-[16px] h-[16px] text-[#22E025] fill-[#153A2D] shrink-0" />
              )}
            </div>
            <p className="text-[13px] text-[#9CA3AF] font-medium mt-0.5">
              {modulo.aulas.length} aula{modulo.aulas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Ícone de seta (chevron) na extremidade direita */}
        <div className="text-[#9CA3AF] shrink-0">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-[#22E025]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
          )}
        </div>
      </button>

      {/* Módulo expandido: sub-lista indentada das aulas */}
      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1E272B] bg-[#0B0F10]/80">
          {modulo.aulas.map((aula, index) => {
            const proximaAula = modulo.aulas[index + 1];
            return (
              <ItemAula
                key={aula.id}
                aula={aula}
                isAtual={aula.id === aulaAtualId}
                isProximaConcluida={proximaAula?.concluida ?? false}
                isUltimaDoModulo={index === modulo.aulas.length - 1}
                onSelectAula={onSelectAula}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

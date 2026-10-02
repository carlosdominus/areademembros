import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modulo } from '../types';
import { ItemAula } from './ItemAula';

interface CardModuloProps {
  modulo: Modulo;
  isOpen: boolean;
  aulaAtualId: string;
  onSelectAula: (aulaId: string) => void;
}

export const CardModulo: React.FC<CardModuloProps> = ({
  modulo,
  isOpen,
  aulaAtualId,
  onSelectAula
}) => {
  const todasConcluidas = modulo.aulas.length > 0 && modulo.aulas.every((a) => a.concluida);

  return (
    <div className="vidro rounded-[20px] overflow-hidden transition-all duration-150">
      {/* Cabeçalho de cada módulo (apenas identificação, não expande/colapsa) */}
      <div className="w-full min-h-[56px] p-4 text-left flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Badge numerado à esquerda: rgba(65,242,10,0.08), texto #41F20A font-bold */}
          <div className="w-[32px] h-[32px] rounded-[10px] bg-[rgba(65,242,10,0.08)] border border-[rgba(65,242,10,0.22)] text-[#41F20A] font-bold text-[14px] font-['Inter_Tight',sans-serif] flex items-center justify-center shrink-0">
            {modulo.ordem}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
                className={`font-['Inter_Tight',sans-serif] text-[14.5px] font-semibold tracking-tight truncate ${
                  isOpen || modulo.aulas.some((a) => a.id === aulaAtualId)
                    ? 'text-[#EDF4EB]'
                    : 'text-[#A7B7A4]'
                }`}
              >
                {modulo.titulo}
              </h4>
              {todasConcluidas && (
                <CheckCircle2 className="w-[16px] h-[16px] text-[#41F20A] shrink-0" />
              )}
            </div>
            <p className="font-['Inter_Tight',sans-serif] font-normal text-[12.5px] text-[#A7B7A4] mt-0.5">
              {modulo.aulas.length} aula{modulo.aulas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Módulo expandido: sub-lista indentada das aulas */}
      {isOpen && (
        <div className="lista-aulas p-2 space-y-1 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.30)]">
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

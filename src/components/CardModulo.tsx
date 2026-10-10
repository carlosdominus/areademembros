import React, { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
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

  // Agrupa as aulas em seções recolhíveis quando o módulo usa o campo "grupo".
  // Sem grupo, a lista continua plana como nos demais módulos.
  const grupos: { nome: string; aulas: typeof modulo.aulas }[] = [];
  modulo.aulas.forEach((a) => {
    if (!a.grupo) return;
    const existente = grupos.find((g) => g.nome === a.grupo);
    if (existente) existente.aulas.push(a);
    else grupos.push({ nome: a.grupo, aulas: [a] });
  });
  const temGrupos = grupos.length > 0 && grupos.every((g) => g.aulas.length > 0)
    && modulo.aulas.every((a) => !!a.grupo);

  // Abre a gaveta da aula em exibição; na falta dela, a primeira.
  const grupoDaAulaAtual = modulo.aulas.find((a) => a.id === aulaAtualId)?.grupo;
  const [gruposFechados, setGruposFechados] = useState<Record<string, boolean>>({});
  const estaAberto = (nome: string) => {
    if (nome in gruposFechados) return !gruposFechados[nome];
    return grupoDaAulaAtual ? nome === grupoDaAulaAtual : nome === grupos[0]?.nome;
  };
  const alternarGrupo = (nome: string) =>
    setGruposFechados((prev) => ({ ...prev, [nome]: estaAberto(nome) }));

  const listaDeAulas = (aulas: typeof modulo.aulas) =>
    aulas.map((aula, index) => (
      <ItemAula
        key={aula.id}
        aula={aula}
        isAtual={aula.id === aulaAtualId}
        isProximaConcluida={aulas[index + 1]?.concluida ?? false}
        isUltimaDoModulo={index === aulas.length - 1}
        onSelectAula={onSelectAula}
      />
    ));

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
          {temGrupos
            ? grupos.map((grupo) => {
                const aberto = estaAberto(grupo.nome);
                const concluidas = grupo.aulas.filter((a) => a.concluida).length;
                return (
                  <div key={grupo.nome} className="rounded-[12px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                    <button
                      type="button"
                      onClick={() => alternarGrupo(grupo.nome)}
                      aria-expanded={aberto}
                      className="w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.04] transition-colors cursor-pointer focus-visible:outline-none"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="font-['Inter_Tight',sans-serif] font-semibold text-[13px] text-[#EDF4EB] truncate">
                          {grupo.nome}
                        </span>
                        <span className="font-['Inter_Tight',sans-serif] text-[11.5px] text-[#A7B7A4] shrink-0">
                          {concluidas > 0
                            ? `${concluidas}/${grupo.aulas.length} aulas`
                            : `${grupo.aulas.length} aulas`}
                        </span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#41F20A] shrink-0 transition-transform duration-200 ${aberto ? '' : '-rotate-90'}`}
                      />
                    </button>
                    {aberto && (
                      <div className="p-1.5 pt-0 space-y-1">{listaDeAulas(grupo.aulas)}</div>
                    )}
                  </div>
                );
              })
            : listaDeAulas(modulo.aulas)}
        </div>
      )}
    </div>
  );
};

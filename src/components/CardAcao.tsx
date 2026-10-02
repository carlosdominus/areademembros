import React, { useState } from 'react';
import { Check, Star, RefreshCw, Lock } from 'lucide-react';

interface CardAcaoProps {
  concluida: boolean;
  avaliacao?: number | null;
  onToggleConcluida: () => void;
  onSetRating: (rating: number) => void;
  loading?: boolean;
  emBreve?: boolean;
}

export const CardAcao: React.FC<CardAcaoProps> = ({
  concluida,
  avaliacao = null,
  onToggleConcluida,
  onSetRating,
  loading = false,
  emBreve = false
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const rating = avaliacao || 0;

  // Se a aula for "Em breve", exibe apenas o status bloqueado sem opção de concluir
  if (emBreve) {
    return (
      <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0">
        <div className="h-[42px] px-4 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-[#A7B7A4] font-['Inter_Tight',sans-serif] text-[13px] font-medium flex items-center gap-2 select-none">
          <Lock className="w-3.5 h-3.5 text-[#A7B7A4]" />
          <span>Aula em breve</span>
        </div>
        <p className="text-[12px] text-[#7A8B78] font-['Inter_Tight',sans-serif]">
          Conteúdo ainda não liberado
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
      {/* Botão Interativo: Marcar / Desmarcar como Concluída */}
      {concluida ? (
        <button
          type="button"
          onClick={onToggleConcluida}
          disabled={loading}
          title="Clique para desmarcar como concluída se necessário"
          className="btn-vidro h-[44px] px-5 rounded-[12px] font-['Inter_Tight',sans-serif] font-semibold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-[#ff4d4d]/40 hover:text-[#ff7070] text-[#41F20A] group disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#41F20A]" />
          ) : (
            <Check className="w-4 h-4 stroke-[3] text-[#41F20A] group-hover:hidden" />
          )}
          <span className="group-hover:hidden">{loading ? 'Salvando...' : 'Aula concluída'}</span>
          <span className="hidden group-hover:inline text-[13px]">Desmarcar conclusão</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleConcluida}
          disabled={loading}
          className="btn h-[44px] px-5 rounded-[12px] font-['Inter_Tight',sans-serif] font-semibold text-[13.5px] flex items-center justify-center gap-2 text-[#062800] cursor-pointer transition-all disabled:opacity-60 shadow-[0_0_15px_rgba(65,242,10,0.25)]"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#062800]" />
          ) : (
            <Check className="w-4 h-4 stroke-[2.5] text-[#062800]" />
          )}
          <span>{loading ? 'Salvando...' : 'Marcar como Concluída'}</span>
        </button>
      )}

      {/* Avaliação por estrelas */}
      <div className="flex flex-col items-start sm:items-end gap-1 font-['Inter_Tight',sans-serif]">
        <p className="text-[12.5px] font-normal text-[#A7B7A4]">
          O que você achou desta aula?
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = (hoverRating || rating) >= star;
            return (
              <button
                key={star}
                type="button"
                disabled={loading}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => onSetRating(star)}
                className="p-0.5 hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none disabled:opacity-50"
                title={`Avaliar ${star} estrela${star > 1 ? 's' : ''}`}
                aria-label={`Avaliar ${star} estrelas`}
              >
                <Star
                  className={`w-[20px] h-[20px] transition-colors duration-150 ${
                    active
                      ? 'text-[#41F20A] fill-[#41F20A]'
                      : 'text-[#A7B7A4]/40 stroke-[1.5]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};



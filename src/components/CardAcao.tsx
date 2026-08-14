import React, { useState } from 'react';
import { Check, Star, RefreshCw } from 'lucide-react';

interface CardAcaoProps {
  concluida: boolean;
  avaliacao?: number | null;
  onToggleConcluida: () => void;
  onSetRating: (rating: number) => void;
  loading?: boolean;
}

export const CardAcao: React.FC<CardAcaoProps> = ({
  concluida,
  avaliacao = null,
  onToggleConcluida,
  onSetRating,
  loading = false
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const rating = avaliacao || 0;

  return (
    <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
      {/* Botão "Aula Concluída" */}
      {concluida ? (
        <button
          type="button"
          disabled={true}
          className="btn-vidro h-[44px] px-5 rounded-[12px] font-['Inter_Tight',sans-serif] font-semibold text-[13.5px] flex items-center justify-center gap-2 cursor-default opacity-95 select-none"
        >
          <Check className="w-4 h-4 stroke-[2.5] text-[#41F20A]" />
          <span>Aula concluída</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggleConcluida}
          disabled={loading}
          className="btn h-[44px] px-5 rounded-[12px] font-['Inter_Tight',sans-serif] font-semibold text-[13.5px] flex items-center justify-center gap-2 text-[#062800] cursor-pointer transition-all disabled:opacity-60"
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


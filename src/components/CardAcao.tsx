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
      {/* Botão "Aula Concluída" com canto arredondado 10px */}
      <button
        onClick={onToggleConcluida}
        disabled={loading}
        className={`h-[38px] px-4 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 ${
          concluida 
            ? 'bg-[#22E025] hover:bg-[#1CC91F] text-[#050E06] shadow-[0_0_15px_rgba(34,224,37,0.3)]' 
            : 'bg-[#0B0F10] border border-[#1E272B] hover:border-[#22E025]/50 text-white'
        }`}
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-[#22E025]" />
        ) : (
          <Check className={`w-4 h-4 stroke-[2.5] ${concluida ? 'text-[#050E06]' : 'text-[#22E025]'}`} />
        )}
        <span>{concluida ? 'Aula Concluída' : 'Marcar como Concluída'}</span>
      </button>

      {/* Avaliação por estrelas */}
      <div className="flex flex-col items-start sm:items-end gap-1">
        <p className="text-[12px] font-medium text-[#9CA3AF]">
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
                      ? 'text-[#22E025] fill-[#22E025]'
                      : 'text-[#6B7280] stroke-[1.5]'
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

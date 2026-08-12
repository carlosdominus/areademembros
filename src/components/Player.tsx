import React from 'react';
import { Play } from 'lucide-react';
import { Aula } from '../types';

interface PlayerProps {
  aula: Aula | null;
  loading?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ aula, loading = false }) => {
  // Skeleton loading state
  if (loading || !aula) {
    return (
      <div className="relative w-full aspect-[16/9] rounded-2xl bg-[#0B0F10] border border-[#1E272B] overflow-hidden flex flex-col items-center justify-center animate-pulse">
        <div className="w-16 h-16 rounded-full bg-[#153A2D]/50 border border-[#22E025]/20 flex items-center justify-center mb-3">
          <Play className="w-8 h-8 text-[#22E025]/40 ml-1" />
        </div>
        <div className="h-4 w-48 bg-[#1E272B] rounded-full mb-2" />
        <div className="h-3 w-32 bg-[#1E272B]/60 rounded-full" />
      </div>
    );
  }

  const vturbId = aula.vturbEmbedId || '67041a0e9a7e02000b12b50d';
  // Standard VTurb responsive iframe player URL
  const iframeSrc = `https://scripts.converteai.net/embed/html/player.html?id=${vturbId}`;

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl bg-[#040607] overflow-hidden border border-[#1E272B] shadow-2xl group transition-all duration-300">
      {/* VTurb Player Embed */}
      <iframe
        id={`vturb-player-${aula.id}`}
        src={iframeSrc}
        className="w-full h-full border-0 absolute inset-0 z-0 bg-[#040607]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={aula.titulo}
      />
    </div>
  );
};

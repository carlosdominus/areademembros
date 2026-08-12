import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Play, Clock, Sparkles } from 'lucide-react';
import { auth } from '../lib/firebase';
import { Aula } from '../types';

interface PlayerProps {
  aula: Aula | null;
  loading?: boolean;
}

const WATERMARK_POSITIONS = [
  'top-4 left-4',
  'top-4 right-4',
  'bottom-12 right-4',
  'bottom-12 left-4',
  'top-1/3 left-1/2 -translate-x-1/2',
  'bottom-1/3 right-10'
];

export const Player: React.FC<PlayerProps> = ({ aula, loading = false }) => {
  const [positionIndex, setPositionIndex] = useState(0);

  // 30-second interval timer for anti-leak watermark position rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setPositionIndex((prev) => (prev + 1) % WATERMARK_POSITIONS.length);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch verified user session directly from Firebase Auth
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || 'aluno@dominus.site';
  const userName = currentUser?.displayName || userEmail.split('@')[0];
  const watermarkText = `${userName.toUpperCase()} • ${userEmail.toLowerCase()}`;

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
      
      {/* 1. VTurb Player Embed (Mounted ONLY after data arrives) */}
      <iframe
        id={`vturb-player-${aula.id}`}
        src={iframeSrc}
        className="w-full h-full border-0 absolute inset-0 z-0 bg-[#040607]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={aula.titulo}
      />

      {/* 2. Anti-Leak Dynamic Watermark Overlay */}
      <div
        className={`absolute z-20 pointer-events-none transition-all duration-700 ease-in-out ${WATERMARK_POSITIONS[positionIndex]}`}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-black/60 border border-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-bold text-white/70 tracking-wider shadow-lg flex items-center gap-1.5 opacity-35 select-none">
          <ShieldCheck className="w-3 h-3 text-[#22E025]" />
          <span>{watermarkText}</span>
        </div>
      </div>

      {/* 3. Protection Pill Badge (top right) */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <div className="bg-[#040607]/80 border border-[#22E025]/30 text-[#22E025] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 backdrop-blur-md opacity-80">
          <Lock className="w-3 h-3" />
          <span>SESSÃO PROTEGIDA</span>
        </div>
      </div>

    </div>
  );
};

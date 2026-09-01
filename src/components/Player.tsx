import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Play, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { Aula } from '../types';

interface PlayerProps {
  aula: Aula | null;
  loading?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ aula, loading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extrai o ID limpo do player VTurb e o ID da conta
  const isEmBreve = aula?.emBreve || !aula?.vturbEmbedId;

  const { playerId, accountId } = useMemo(() => {
    const defaultAccountId = '853c4f04-8442-44da-b89d-0541d78036bb';
    const rawId = aula?.vturbEmbedId;
    if (!rawId) {
      return { playerId: '', accountId: defaultAccountId };
    }

    // Se vier a URL completa do script VTurb
    const scriptMatch = rawId.match(/players\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/v4\/player\.js/);
    if (scriptMatch) {
      return { accountId: scriptMatch[1], playerId: scriptMatch[2] };
    }

    // Se vier vid-XXXXX
    const vidMatch = rawId.match(/vid-([a-zA-Z0-9]+)/);
    if (vidMatch) {
      return { playerId: vidMatch[1], accountId: defaultAccountId };
    }

    const clean = rawId.replace(/^vid-/, '').trim();
    return { playerId: clean || '', accountId: defaultAccountId };
  }, [aula?.vturbEmbedId]);

  // Carrega o script do VTurb diretamente no DOM para habilitar Fullscreen nativo em Desktop e Mobile
  useEffect(() => {
    if (!playerId || isEmBreve) return;

    const scriptId = `vturb-script-${playerId}`;
    
    // Limpa script anterior se existir
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://scripts.converteai.net/${accountId}/players/${playerId}/v4/player.js`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById(scriptId);
      if (s) {
        s.remove();
      }
    };
  }, [playerId, accountId, isEmBreve]);

  // Monitora mudanças de Fullscreen no documento e força orientação horizontal (landscape) em telas mobile
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const activeFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(activeFs);

      if (activeFs) {
        // Tenta rotacionar o celular para o modo paisagem (horizontal)
        try {
          if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          } else if ((screen as any).lockOrientation) {
            (screen as any).lockOrientation('landscape');
          } else if ((screen as any).webkitLockOrientation) {
            (screen as any).webkitLockOrientation('landscape');
          } else if ((screen as any).mozLockOrientation) {
            (screen as any).mozLockOrientation('landscape');
          } else if ((screen as any).msLockOrientation) {
            (screen as any).msLockOrientation('landscape');
          }
        } catch {
          // Ignorado caso o dispositivo/navegador não dê permissão
        }
      } else {
        // Desbloqueia orientação ao sair da tela cheia
        try {
          if (screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
            (screen.orientation as any).unlock();
          } else if ((screen as any).unlockOrientation) {
            (screen as any).unlockOrientation();
          } else if ((screen as any).webkitUnlockOrientation) {
            (screen as any).webkitUnlockOrientation();
          } else if ((screen as any).mozUnlockOrientation) {
            (screen as any).mozUnlockOrientation();
          } else if ((screen as any).msUnlockOrientation) {
            (screen as any).msUnlockOrientation();
          }
        } catch {
          // Ignorado
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Função para alternar Fullscreen manualmente pelo botão do topo
  const toggleFullscreen = async () => {
    const target = containerRef.current;
    if (!target) return;

    const isFs = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFs) {
      // 1. Suporte específico para iOS Safari (reprodução nativa no elemento video)
      const video = target.querySelector('video');
      if (video && (video as any).webkitEnterFullscreen && !(target as any).requestFullscreen) {
        try {
          (video as any).webkitEnterFullscreen();
          return;
        } catch {
          // segue para a API padrão
        }
      }

      // 2. Fullscreen API padrão
      if (target.requestFullscreen) {
        await target.requestFullscreen().catch(() => {});
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      } else if ((target as any).mozRequestFullScreen) {
        await (target as any).mozRequestFullScreen();
      } else if ((target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen();
      }

      // 3. Força rotação para paisagem no mobile
      try {
        if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch {
        // Ignorado
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    }
  };

  // Skeleton loading state
  if (loading || !aula) {
    return (
      <div className="relative w-full aspect-video bg-[#0B110D] border border-[rgba(255,255,255,0.08)] rounded-[16px] sm:rounded-[20px] overflow-hidden flex flex-col items-center justify-center animate-pulse shadow-2xl">
        <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-[rgba(65,242,10,0.08)] border border-[rgba(65,242,10,0.22)] flex items-center justify-center mb-3">
          <Play className="w-7 sm:w-8 h-7 sm:h-8 text-[#41F20A]/50 ml-1" />
        </div>
        <div className="h-4 w-44 sm:w-56 bg-[rgba(255,255,255,0.08)] rounded-full mb-2" />
        <div className="h-3 w-28 sm:w-36 bg-[rgba(255,255,255,0.05)] rounded-full" />
      </div>
    );
  }

  // Em Breve state
  if (isEmBreve) {
    return (
      <div className="relative w-full aspect-video rounded-[16px] sm:rounded-[20px] overflow-hidden bg-[#0A0F0C] border border-[rgba(255,255,255,0.09)] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(65,242,10,0.08)] border border-[rgba(65,242,10,0.25)] flex items-center justify-center mb-4 text-[#41F20A] shadow-[0_0_20px_rgba(65,242,10,0.15)]">
          <Clock className="w-8 h-8 stroke-[2]" />
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[rgba(65,242,10,0.15)] text-[#41F20A] border border-[rgba(65,242,10,0.3)] mb-2">
          Em Breve
        </span>
        <h3 className="text-white font-bold text-base sm:text-lg max-w-md mb-1">
          {aula.titulo}
        </h3>
        <p className="text-[#A7B7A4] text-xs sm:text-sm max-w-sm">
          Esta aula está sendo finalizada e será disponibilizada em breve na sua área de membros.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      key={`${aula.id}-${playerId}`}
      className="player-container relative w-full aspect-video rounded-[16px] sm:rounded-[20px] overflow-hidden bg-black border border-[rgba(255,255,255,0.09)] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85)] group select-none flex items-center justify-center"
    >
      <div id={`vid-${playerId}-wrapper`} className="w-full h-full relative flex items-center justify-center bg-black">
        {React.createElement(
          'vturb-smartplayer',
          {
            id: `vid-${playerId}`,
            style: { display: 'block', margin: '0 auto', width: '100%', height: '100%' }
          },
          <div
            className="vturb-player-placeholder"
            style={{
              position: 'relative',
              width: '100%',
              padding: '56.25% 0 0',
              zIndex: 0,
              backgroundColor: 'black'
            }}
          />
        )}
      </div>

      {/* Botão de Tela Cheia / Rotação Horizontal */}
      <button
        onClick={toggleFullscreen}
        type="button"
        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia horizontal'}
        className="absolute top-3 right-3 z-30 opacity-75 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 bg-[rgba(0,0,0,0.7)] hover:bg-[rgba(0,0,0,0.95)] backdrop-blur-md text-white hover:text-[#41F20A] p-2 sm:p-2.5 rounded-xl border border-[rgba(255,255,255,0.18)] shadow-lg cursor-pointer flex items-center justify-center"
        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia (Modo horizontal)'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 text-[#41F20A]" />
        ) : (
          <Maximize2 className="w-4 h-4 text-white hover:text-[#41F20A]" />
        )}
      </button>
    </div>
  );
};





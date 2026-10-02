import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Play, Clock } from 'lucide-react';
import { Aula } from '../types';

interface PlayerProps {
  aula: Aula | null;
  loading?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ aula, loading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
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

    // Se vier vid-XXXXX ou vid_XXXXX
    const vidMatch = rawId.match(/vid[-_]([a-zA-Z0-9]+)/);
    if (vidMatch) {
      return { playerId: vidMatch[1], accountId: defaultAccountId };
    }

    const clean = rawId.replace(/^vid[-_]/, '').trim();
    return { playerId: clean || '', accountId: defaultAccountId };
  }, [aula?.vturbEmbedId]);

  // Carrega e monta o player nativo do VTurb diretamente no DOM
  useEffect(() => {
    if (!mountRef.current || !playerId || isEmBreve) return;

    const container = mountRef.current;
    
    // Injeta a estrutura de tag do SmartPlayer do VTurb
    container.innerHTML = `
      <vturb-smartplayer id="vid-${playerId}" style="display: block; margin: 0 auto; width: 100%;">
        <div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: 56.25% 0 0; z-index: 0; background-color: black;"></div>
      </vturb-smartplayer>
    `;

    // Injeta o script do VTurb para ativar o player nativo com controles e tela cheia
    const scriptId = `scr-${playerId}`;
    const oldScript = document.getElementById(scriptId);
    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://scripts.converteai.net/${accountId}/players/${playerId}/v4/player.js`;
    script.async = true;
    document.head.appendChild(script);

    // Escuta elementos de vídeo adicionados pelo VTurb para eventos de Fullscreen do iOS Safari
    const attachVideoListeners = (videoEl: HTMLVideoElement) => {
      const onBeginFs = () => {
        setIsFullscreen(true);
        document.body.classList.add('has-fullscreen-player');
        document.documentElement.classList.add('has-fullscreen-player');
      };
      const onEndFs = () => {
        setIsFullscreen(false);
        document.body.classList.remove('has-fullscreen-player');
        document.documentElement.classList.remove('has-fullscreen-player');
      };

      videoEl.addEventListener('webkitbeginfullscreen', onBeginFs);
      videoEl.addEventListener('webkitendfullscreen', onEndFs);
      videoEl.addEventListener('fullscreenchange', onBeginFs);

      return () => {
        videoEl.removeEventListener('webkitbeginfullscreen', onBeginFs);
        videoEl.removeEventListener('webkitendfullscreen', onEndFs);
        videoEl.removeEventListener('fullscreenchange', onBeginFs);
      };
    };

    const cleanups: (() => void)[] = [];
    const observer = new MutationObserver(() => {
      const videos = container.querySelectorAll('video');
      videos.forEach((video) => {
        if (!(video as any).__fsBound) {
          (video as any).__fsBound = true;
          cleanups.push(attachVideoListeners(video));
        }
      });
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      container.innerHTML = '';
      const s = document.getElementById(scriptId);
      if (s) {
        s.remove();
      }
    };
  }, [playerId, accountId, isEmBreve]);

  // Monitora mudanças de Fullscreen no documento e sincroniza estado
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isFs);

      if (isFs) {
        document.body.classList.add('has-fullscreen-player');
        document.documentElement.classList.add('has-fullscreen-player');
        try {
          if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          } else if ((screen as any).lockOrientation) {
            (screen as any).lockOrientation('landscape');
          } else if ((screen as any).webkitLockOrientation) {
            (screen as any).webkitLockOrientation('landscape');
          }
        } catch {
          // Ignorado caso não permitido
        }
      } else {
        document.body.classList.remove('has-fullscreen-player');
        document.documentElement.classList.remove('has-fullscreen-player');
        try {
          if (screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
            (screen.orientation as any).unlock();
          } else if ((screen as any).unlockOrientation) {
            (screen as any).unlockOrientation();
          }
        } catch {
          // Ignorado
        }
      }
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.type === 'fullscreen' || data.event === 'fullscreen')) {
          if (data.value === true || data.state === true) {
            setIsFullscreen(true);
            document.body.classList.add('has-fullscreen-player');
            document.documentElement.classList.add('has-fullscreen-player');
          } else if (data.value === false || data.state === false) {
            setIsFullscreen(false);
            document.body.classList.remove('has-fullscreen-player');
            document.documentElement.classList.remove('has-fullscreen-player');
          }
        }
      } catch {
        // Ignorado
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('message', handleMessage);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('message', handleMessage);
      document.body.classList.remove('has-fullscreen-player');
      document.documentElement.classList.remove('has-fullscreen-player');
    };
  }, []);

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
      className={`player-container relative w-full overflow-hidden bg-black border border-[rgba(255,255,255,0.09)] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85)] ${
        isFullscreen ? 'is-fullscreen-forced' : 'rounded-[16px] sm:rounded-[20px]'
      }`}
    >
      <div
        ref={mountRef}
        className="w-full relative bg-black flex items-center justify-center"
      />
    </div>
  );
};






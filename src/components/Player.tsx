import React, { useMemo } from 'react';
import { Play } from 'lucide-react';
import { Aula } from '../types';

interface PlayerProps {
  aula: Aula | null;
  loading?: boolean;
}

export const Player: React.FC<PlayerProps> = ({ aula, loading = false }) => {
  // Extrai o ID limpo do player VTurb e o ID da conta
  const { playerId, accountId } = useMemo(() => {
    const defaultAccountId = '853c4f04-8442-44da-b89d-0541d78036bb';
    const rawId = aula?.vturbEmbedId;
    if (!rawId) {
      return { playerId: '6a95dfa8ce382b7f4fcc9073', accountId: defaultAccountId };
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
    return { playerId: clean || '6a95dfa8ce382b7f4fcc9073', accountId: defaultAccountId };
  }, [aula?.vturbEmbedId]);

  // Gera o HTML do documento isolado para renderizar o SmartPlayer v4 com segurança
  const iframeDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .player-box {
      width: 100%;
      height: 100%;
      position: relative;
    }
    vturb-smartplayer {
      display: block !important;
      margin: 0 auto !important;
      width: 100% !important;
      height: 100% !important;
    }
  </style>
</head>
<body>
  <div class="player-box">
    <vturb-smartplayer id="vid-${playerId}" style="display: block; margin: 0 auto; width: 100%; height: 100%;">
      <div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: 56.25% 0 0; z-index: 0; background-color: black;"></div>
    </vturb-smartplayer>
  </div>
  <script type="text/javascript">
    var s = document.createElement("script");
    s.src = "https://scripts.converteai.net/${accountId}/players/${playerId}/v4/player.js";
    s.async = true;
    document.head.appendChild(s);
  </script>
</body>
</html>`;
  }, [playerId, accountId]);

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

  return (
    <div className="relative w-full aspect-video rounded-[16px] sm:rounded-[20px] overflow-hidden bg-black border border-[rgba(255,255,255,0.09)] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85)]">
      <iframe
        key={`${aula.id}-${playerId}`}
        srcDoc={iframeDoc}
        title={aula.titulo}
        className="w-full h-full border-0 absolute inset-0 bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
      />
    </div>
  );
};



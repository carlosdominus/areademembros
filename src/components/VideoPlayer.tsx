import React, { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { Lesson } from '../types';

interface VideoPlayerProps {
  lesson: Lesson;
  onLessonEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ lesson }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract YouTube ID if it's a youtube url
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) {
      return `${url}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`;
    }
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=${isPlaying ? 1 : 0}&rel=0&modestbranding=1`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(lesson.videoUrl);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden adsata-card shadow-2xl group border border-[#1E272B]">
      
      {/* Main Video Stage */}
      <div className="relative aspect-video w-full bg-[#040607] flex items-center justify-center">
        {isPlaying || embedUrl.includes('embed') ? (
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="w-full h-full border-0 rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          /* Thumbnail & Start Stage */
          <div className="relative w-full h-full flex items-center justify-center bg-[#0B0F10]">
            <div className="absolute inset-0 bg-[radial-gradient(#22e025_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

            {/* Video Cover Header Info */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#153A2D] border border-[#22E025]/40 flex items-center justify-center text-[#22E025] font-bold text-xs shadow-md">
                CG
              </div>
              <div>
                <p className="text-sm font-bold text-white drop-shadow-md">{lesson.title}</p>
                <p className="text-[11px] text-[#22E025] font-medium">Mentoria Cakto Members</p>
              </div>
            </div>

            {/* Ultra-Sleek Modern Play Button */}
            <div className="relative z-10">
              <div className="absolute -inset-3 rounded-full bg-[#22E025]/30 blur-md animate-pulse" />
              <button
                onClick={() => setIsPlaying(true)}
                className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#22E025] to-[#30FF33] text-[#050E06] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 shadow-[0_0_40px_rgba(34,224,37,0.6)] border-2 border-white/40 group/btn"
                title="Iniciar reprodução da aula"
              >
                <div className="w-8 h-8 flex items-center justify-center ml-1">
                  <svg className="w-8 h-8 fill-current text-[#050E06] transition-transform duration-300 group-hover/btn:scale-110" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Bottom External Link Badge */}
            <div className="absolute bottom-4 right-4 z-10">
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#040607]/80 hover:bg-[#040607] text-white text-xs font-semibold backdrop-blur-md border border-[#1E272B] hover:border-[#22E025]/50 transition-colors"
              >
                Abrir no <span className="font-bold text-[#22E025] flex items-center">YouTube <ExternalLink className="w-3 h-3 ml-1" /></span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


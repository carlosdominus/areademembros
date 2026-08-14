import React, { useState, useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';

interface CabecalhoProps {
  nomePlataforma?: string;
  nomeAluno?: string;
  emailAluno?: string;
  onLogout?: () => void;
  onToggleSidebarMobile?: () => void;
  isSidebarMobileOpen?: boolean;
  onGoHome?: () => void;
}

export const Cabecalho: React.FC<CabecalhoProps> = ({
  nomePlataforma = 'Área de Membros',
  nomeAluno = 'Carlos Gabriel',
  emailAluno = 'carlos@dominus.site',
  onLogout,
  onGoHome
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);

  // Close menu on Esc key and on click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (perfilRef.current && !perfilRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="vidro-header h-[64px] w-full px-4 sm:px-8 lg:px-10 flex items-center justify-between">
      {/* Left: Monograma "D" + Texto "Área de Membros" */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          {/* Monograma D */}
          <div className="marca">D</div>
          
          {/* Texto "Área de Membros" em Inter Tight 600, 15px, --texto */}
          <span className="font-['Inter_Tight',sans-serif] font-semibold text-[15px] text-[#EDF4EB] tracking-tight truncate group-hover:text-[#41F20A] transition-colors">
            {nomePlataforma}
          </span>
        </button>
      </div>

      {/* Right: Circular User Avatar with outside click handling */}
      <div className="perfil relative" ref={perfilRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            background: 'linear-gradient(180deg, #7BFA45 0%, #41F20A 46%, #2BB102 64%, #1A8300 100%)'
          }}
          className="w-[38px] h-[38px] rounded-full text-[#062800] font-semibold text-[13.5px] font-['Inter_Tight',sans-serif] flex items-center justify-center cursor-pointer focus-visible:outline-none hover:brightness-105 transition-all shadow-sm"
          title={nomeAluno}
          aria-label="Menu do usuário"
        >
          {getInitials(nomeAluno)}
        </button>

        {/* User Menu Dropdown (abre para baixo, ancorado no avatar) */}
        {showUserMenu && (
          <div className="perfil-menu w-[240px] vidro rounded-[18px] p-4 shadow-2xl animate-menu-open">
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{
                  background: 'linear-gradient(180deg, #7BFA45 0%, #41F20A 46%, #2BB102 64%, #1A8300 100%)'
                }}
                className="w-[38px] h-[38px] rounded-full text-[#062800] font-semibold text-[13.5px] font-['Inter_Tight',sans-serif] flex items-center justify-center shrink-0"
              >
                {getInitials(nomeAluno)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-['Inter_Tight',sans-serif] font-semibold text-[15px] text-[#EDF4EB] truncate leading-tight">
                  {nomeAluno}
                </p>
                <p className="font-['Inter_Tight',sans-serif] font-normal text-[12.5px] text-[#A7B7A4] [overflow-wrap:anywhere] leading-tight mt-0.5">
                  {emailAluno}
                </p>
              </div>
            </div>

            {/* Divisória 1px solid rgba(255,255,255,.08) */}
            <div className="my-3 border-t border-[rgba(255,255,255,0.08)]" />

            {/* Sair da plataforma */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                if (onLogout) onLogout();
              }}
              className="w-full h-[40px] rounded-[10px] px-3 font-['Inter_Tight',sans-serif] font-medium text-[13.5px] text-[#D9E4D6] hover:bg-[rgba(248,113,113,0.10)] hover:text-[#FCA5A5] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#A7B7A4]" />
              <span>Sair da plataforma</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};


import React, { useState, useEffect } from 'react';
import { BookOpen, LogOut } from 'lucide-react';

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

  // Close menu on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      {/* Left: Logo Icon + Brand Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          {/* Quadrado de 40px, border-radius 12px, fundo rgba(65,242,10,.08), borda 1px solid rgba(65,242,10,.22), traço em --v-vivo */}
          <div className="w-[40px] h-[40px] rounded-[12px] bg-[rgba(65,242,10,0.08)] border border-[rgba(65,242,10,0.22)] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-[#41F20A]" />
          </div>
          
          {/* Texto "Área de Membros" em Inter Tight 600, 15px, --texto */}
          <span className="font-['Inter_Tight',sans-serif] font-semibold text-[15px] text-[#EDF4EB] tracking-tight truncate group-hover:text-[#41F20A] transition-colors">
            {nomePlataforma}
          </span>
        </button>
      </div>

      {/* Right: Circular User Avatar */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            background: 'linear-gradient(180deg, #7BFA45 0%, #41F20A 46%, #2BB102 64%, #1A8300 100%)'
          }}
          className="w-[40px] h-[40px] rounded-full text-[#062800] font-semibold text-[14px] font-['Inter_Tight',sans-serif] flex items-center justify-center cursor-pointer focus-visible:outline-none hover:brightness-105 transition-all shadow-sm"
          title={nomeAluno}
          aria-label="Menu do usuário"
        >
          {getInitials(nomeAluno)}
        </button>

        {/* User Menu Dropdown (Vidro completo, border-radius 18px, 240px, p-4) */}
        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-[240px] vidro rounded-[18px] p-4 z-50 animate-menu-open">
              <div className="flex items-center gap-3 mb-3">
                <div
                  style={{
                    background: 'linear-gradient(180deg, #7BFA45 0%, #41F20A 46%, #2BB102 64%, #1A8300 100%)'
                  }}
                  className="w-[40px] h-[40px] rounded-full text-[#062800] font-semibold text-[14px] font-['Inter_Tight',sans-serif] flex items-center justify-center shrink-0"
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

              {/* Divisória 1px solid rgba(255,255,255,.08) com 12px de respiro */}
              <div className="my-3 border-t border-[rgba(255,255,255,0.08)]" />

              {/* Sair da plataforma */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full h-[40px] rounded-[10px] px-3 font-['Inter_Tight',sans-serif] font-medium text-[13.5px] text-[#D9E4D6] hover:bg-[rgba(248,113,113,0.10)] hover:text-[#FCA5A5] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#A7B7A4] group-hover:text-[#FCA5A5]" />
                <span>Sair da plataforma</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};


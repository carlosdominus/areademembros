import React, { useState } from 'react';
import { BookOpen, LogOut, Menu, X } from 'lucide-react';

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
  nomeAluno = 'Carlos Guilherme',
  emailAluno = 'carlos@dominus.site',
  onLogout,
  onToggleSidebarMobile,
  isSidebarMobileOpen = false,
  onGoHome
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 h-[64px] w-full bg-[#040607]/85 backdrop-blur-md border-b border-[#1E272B] px-4 sm:px-8 lg:px-10 flex items-center justify-between transition-all">
      {/* Left: Logo Icon + Brand Name */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle for course sidebar */}
        {onToggleSidebarMobile && (
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 min-h-[40px] min-w-[40px] rounded-[10px] bg-[#0B0F10] border border-[#1E272B] text-[#F3F4F6] hover:text-[#22E025] hover:border-[#22E025]/50 transition-all duration-150 flex items-center justify-center cursor-pointer"
            title="Ver Conteúdo do Curso"
            aria-label="Toggle Conteúdo do Curso"
          >
            {isSidebarMobileOpen ? (
              <X className="w-5 h-5 text-[#22E025]" />
            ) : (
              <Menu className="w-5 h-5 text-[#22E025]" />
            )}
          </button>
        )}

        {/* Logo in rounded square */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-[36px] h-[36px] rounded-[10px] bg-[#153A2D] border border-[#22E025]/40 text-[#22E025] flex items-center justify-center font-bold shrink-0 shadow-[0_0_15px_rgba(34,224,37,0.25)] group-hover:border-[#22E025] transition-all">
            <BookOpen className="w-4 h-4 text-[#22E025] stroke-[2.5]" />
          </div>
          
          {/* Brand Name */}
          <span className="font-extrabold text-[16px] lg:text-[18px] text-white tracking-tight truncate group-hover:text-[#22E025] transition-colors">
            {nomePlataforma}
          </span>
        </button>
      </div>

      {/* Right: Circular User Avatar with Initials */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-[42px] h-[42px] rounded-full bg-[#153A2D] border border-[#22E025]/40 text-[#22E025] font-bold text-[14px] flex items-center justify-center hover:border-[#22E025] hover:shadow-[0_0_15px_rgba(34,224,37,0.4)] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22E025]"
          title={nomeAluno}
          aria-label="Menu do usuário"
        >
          {getInitials(nomeAluno)}
        </button>

        {/* User Menu Dropdown */}
        {showUserMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowUserMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-60 adsata-card shadow-2xl p-3.5 z-50 transition-all duration-150">
              <div className="px-2 py-2 border-b border-[#1E272B] mb-2">
                <p className="text-[13px] font-bold text-white truncate">{nomeAluno}</p>
                <p className="text-[11px] text-[#9CA3AF] truncate">{emailAluno}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full text-left min-h-[38px] px-3 py-2 rounded-xl text-[12px] font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 flex items-center gap-2 transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sair da Plataforma</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};


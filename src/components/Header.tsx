import React, { useState } from 'react';
import { LogOut, Key, User, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  user: UserSession | null;
  onLogout: () => void;
  onOpenAdmin: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  currentBreadcrumb?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenAdmin
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'CG';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#040607]/80 backdrop-blur-md border-b border-[#1E272B] px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#153A2D] border border-[#22E025]/30 flex items-center justify-center text-[#22E025] shadow-[0_0_15px_rgba(34,224,37,0.2)] shrink-0">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a1 1 0 011 1v2.07A5.002 5.002 0 0117 10v3a1 1 0 11-2 0v-3a3 3 0 00-3-3 1 1 0 01-1-1V3a1 1 0 011-1zM7 8a1 1 0 011 1v4a3 3 0 003 3 1 1 0 011 1v4a1 1 0 11-2 0v-2.07A5.002 5.002 0 017 14V9a1 1 0 011-1z" />
            </svg>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-extrabold text-white text-base lg:text-lg tracking-tight">
              Cakto Members
            </h1>
          </div>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-9 h-9 rounded-full bg-[#153A2D] text-[#22E025] border border-[#22E025]/40 flex items-center justify-center font-bold text-xs hover:border-[#22E025] hover:shadow-[0_0_15px_rgba(34,224,37,0.3)] transition-all focus:outline-none cursor-pointer"
                title={user.name || user.email}
              >
                {getInitials(user.name, user.email)}
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 adsata-card p-3 z-50 animate-in fade-in duration-150">
                  <div className="pb-2.5 mb-2 border-b border-[#1E272B] px-1">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">{user.email}</p>
                    <span className="adsata-badge mt-1.5 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-[#22E025]" />
                      Aluno Licenciado
                    </span>
                  </div>

                  <div className="space-y-1">
                    {user.isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#22E025] hover:bg-[#153A2D]/50 flex items-center gap-2 transition-colors font-semibold cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-[#22E025]" />
                        Gerenciar Alunos (Planilha)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      Sair da Plataforma
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#0B0F10] border border-[#1E272B] flex items-center justify-center text-gray-500">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


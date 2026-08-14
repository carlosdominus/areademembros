import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Modulo } from '../types';
import { CardModulo } from './CardModulo';

interface SidebarCursoProps {
  modulos: Modulo[];
  aulaAtualId: string;
  moduloAtualId: string;
  onSelectAula: (aulaId: string) => void;
  onSelectModulo?: (moduloId: string) => void;
  onGoHome?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  loading?: boolean;
}

export const SidebarCurso: React.FC<SidebarCursoProps> = ({
  modulos,
  aulaAtualId,
  moduloAtualId,
  onSelectAula,
  onSelectModulo,
  onGoHome,
  isMobileOpen = false,
  onCloseMobile,
  loading = false
}) => {
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Find active module or default to first
  const moduloAtual = modulos.find((m) => m.id === moduloAtualId) || modulos[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <aside className="w-full h-full space-y-3 animate-pulse">
        <div className="h-6 w-40 bg-[rgba(255,255,255,0.05)] rounded-md" />
        <div className="h-12 w-full vidro rounded-[12px]" />
        <div className="h-40 w-full vidro rounded-[20px]" />
      </aside>
    );
  }

  const sidebarContent = (
    <div
      ref={sidebarContainerRef}
      className="h-full flex flex-col bg-transparent"
    >
      {/* Título "Conteúdo do Módulo" */}
      <div className="pb-3 flex items-center justify-between shrink-0">
        <h2 className="font-['Inter_Tight',sans-serif] font-semibold text-[16px] text-[#EDF4EB] tracking-tight">
          Conteúdo do Módulo
        </h2>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.11)] text-[#A7B7A4] hover:text-[#EDF4EB] flex items-center justify-center cursor-pointer"
            title="Fechar"
            aria-label="Fechar conteúdo do módulo"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Seletor Customizado de Módulo */}
      {modulos.length > 1 && moduloAtual && (
        <div className="mb-3 shrink-0 relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full btn-vidro h-[44px] px-3.5 flex items-center justify-between gap-2 text-[#EDF4EB] font-['Inter_Tight',sans-serif] font-medium text-[13.5px] cursor-pointer hover:border-[#41F20A]/50 transition-all group"
          >
            <span className="truncate group-hover:text-[#41F20A] transition-colors">
              {moduloAtual.titulo} ({moduloAtual.aulas.length} aulas)
            </span>
            <ChevronDown className={`w-4 h-4 text-[#41F20A] shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Dropdown Estilizado */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] vidro rounded-[14px] p-2 shadow-2xl z-50 max-h-[260px] overflow-y-auto scrollbar-thin">
              {modulos.map((m) => {
                const isSelected = m.id === moduloAtualId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (onSelectModulo) onSelectModulo(m.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-[10px] text-[13px] font-['Inter_Tight',sans-serif] flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[rgba(65,242,10,0.12)] text-[#41F20A] font-semibold border border-[rgba(65,242,10,0.30)]'
                        : 'text-[#D9E4D6] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#EDF4EB]'
                    }`}
                  >
                    <span className="truncate">
                      {m.titulo} ({m.aulas.length} aulas)
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#41F20A] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mostra apenas o conteúdo do Módulo Atual */}
      <div className="flex-1 overflow-y-auto space-y-[12px] pr-1">
        {moduloAtual && (
          <CardModulo
            key={moduloAtual.id}
            modulo={moduloAtual}
            isOpen={true}
            aulaAtualId={aulaAtualId}
            onToggleAccordion={() => {}}
            onSelectAula={(aulaId) => {
              onSelectAula(aulaId);
              if (onCloseMobile) onCloseMobile();
            }}
          />
        )}

        {/* Botão para ver todos os módulos no grid / Homepage */}
        {onGoHome && (
          <button
            onClick={() => {
              onGoHome();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full mt-3 btn-vidro h-[44px] text-[#41F20A] font-['Inter_Tight',sans-serif] text-[13.5px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver Todos os Módulos</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Version */}
      <aside className="hidden lg:block w-full h-full">
        {sidebarContent}
      </aside>

      {/* Mobile/Tablet Version */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Content */}
          <div className="relative mr-auto w-full max-w-[380px] h-full p-5 bg-[#111517] border-r border-[#1E272B] z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

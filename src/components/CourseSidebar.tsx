import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Check, Play, Search, Award } from 'lucide-react';
import { Module, Lesson } from '../types';

interface CourseSidebarProps {
  modules: Module[];
  activeLessonId: string;
  onSelectLesson: (lesson: Lesson, module: Module) => void;
  completedLessonIds: string[];
  searchQuery?: string;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  modules,
  activeLessonId,
  onSelectLesson,
  completedLessonIds,
  searchQuery = ''
}) => {
  // Keep track of open modules (accordion state)
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({
    m0: true,
    m1: true,
    m2: true,
    m3: true
  });

  const toggleModule = (id: string) => {
    setOpenModuleIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate overall progress
  let totalLessons = 0;
  let completedCount = 0;

  modules.forEach((mod) => {
    mod.lessons.forEach((les) => {
      totalLessons++;
      if (completedLessonIds.includes(les.id)) {
        completedCount++;
      }
    });
  });

  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="adsata-card p-4 lg:p-5 space-y-4 shadow-xl">
      
      {/* Title & Overall Course Progress */}
      <div className="space-y-3 pb-3 border-b border-[#1E272B]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            Conteúdo do Curso
          </h3>
          <span className="adsata-badge text-xs font-bold">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-[#0B0F10] h-2 rounded-full overflow-hidden border border-[#1E272B]">
            <div
              className="bg-gradient-to-r from-[#22E025] to-[#30FF33] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(34,224,37,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 text-right font-medium">
            {completedCount} de {totalLessons} aulas concluídas
          </p>
        </div>
      </div>

      {/* Modules List Accordions */}
      <div className="space-y-2.5">
        {modules.map((mod) => {
          const modCompletedLessons = mod.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
          const isModuleFullyCompleted = mod.lessons.length > 0 && modCompletedLessons === mod.lessons.length;
          const isOpen = openModuleIds[mod.id] ?? false;

          // Filter lessons if searching
          const filteredLessons = mod.lessons.filter(
            (l) =>
              !searchQuery ||
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              mod.title.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery && filteredLessons.length === 0) {
            return null; // hide empty search module
          }

          return (
            <div
              key={mod.id}
              className="border border-[#1E272B] bg-[#0B0F10] rounded-xl overflow-hidden transition-all"
            >
              {/* Module Header Bar */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#153A2D]/30 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3 pr-2">
                  {/* Module Number Box */}
                  <div className="w-7 h-7 rounded-lg bg-[#153A2D] border border-[#22E025]/40 flex items-center justify-center font-bold text-xs text-[#22E025] shrink-0">
                    {mod.order}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5 leading-snug">
                      <span>{mod.title}</span>
                      {isModuleFullyCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22E025] shrink-0" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {mod.lessons.length} {mod.lessons.length === 1 ? 'aula' : 'aulas'} • {modCompletedLessons}/{mod.lessons.length} concluídas
                    </p>
                  </div>
                </div>

                <div className="text-[#22E025] shrink-0">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              {/* Lessons Sub-list */}
              {(isOpen || searchQuery) && (
                <div className="border-t border-[#1E272B] bg-[#040607]/60 py-1 px-1 space-y-0.5">
                  {filteredLessons.map((lesson) => {
                    const isActive = lesson.id === activeLessonId;
                    const isCompleted = completedLessonIds.includes(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson, mod)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer relative ${
                          isActive
                            ? 'bg-[#153A2D]/50 text-white border border-[#22E025]/40 font-bold'
                            : 'text-gray-300 hover:bg-[#0B0F10] hover:text-white'
                        }`}
                      >
                        {/* Active Selection Green Vertical Guide Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1 bottom-1 w-1 bg-[#22E025] rounded-r shadow-[0_0_8px_rgba(34,224,37,0.8)]" />
                        )}

                        <div className="flex items-center gap-2.5 pl-2 pr-1 truncate">
                          {/* Completion Status Checkmark or Play Icon */}
                          <div className="shrink-0">
                            {isCompleted ? (
                              <div className="w-5 h-5 rounded-full bg-[#22E025] text-[#050E06] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(34,224,37,0.5)]">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                  isActive
                                    ? 'bg-[#22E025] text-[#050E06] shadow-[0_0_12px_rgba(34,224,37,0.6)] scale-105'
                                    : 'bg-[#153A2D]/80 border border-[#22E025]/40 text-[#22E025] group-hover:bg-[#22E025] group-hover:text-[#050E06] group-hover:shadow-[0_0_10px_rgba(34,224,37,0.5)]'
                                }`}
                              >
                                <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <span className={`truncate text-xs ${isActive ? 'text-[#22E025] font-bold' : 'text-gray-200'}`}>
                            {lesson.title}
                          </span>
                        </div>

                        <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">
                          {lesson.durationMinutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Certificate / Completion Notice */}
      {progressPercent === 100 && (
        <div className="p-3.5 rounded-xl bg-[#153A2D] border border-[#22E025]/40 text-center space-y-1 animate-in fade-in">
          <Award className="w-6 h-6 text-[#22E025] mx-auto" />
          <p className="text-xs font-bold text-white">Parabéns! Mentoria Concluída 100%</p>
          <p className="text-[10px] text-[#22E025]">Você completou todos os módulos da mentoria.</p>
        </div>
      )}

    </div>
  );
};

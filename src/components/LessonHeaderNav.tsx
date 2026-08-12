import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Lesson, Module } from '../types';

interface LessonHeaderNavProps {
  currentModule?: Module;
  currentLesson?: Lesson;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBackOverview?: () => void;
}

export const LessonHeaderNav: React.FC<LessonHeaderNavProps> = ({
  currentModule,
  currentLesson,
  hasPrev,
  hasNext,
  onPrev,
  onNext
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      
      {/* Left: Visible Module & Lesson Title */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 truncate max-w-full sm:max-w-md lg:max-w-lg">
        <BookOpen className="w-4 h-4 text-[#22E025] shrink-0" />
        {currentModule && (
          <>
            <span className="text-[#22E025] font-semibold truncate">
              {currentModule.title.replace(/^\d+\.\s*/, '')}
            </span>
            <span className="text-gray-600">/</span>
          </>
        )}
        {currentLesson && (
          <span className="text-white font-bold truncate">{currentLesson.title}</span>
        )}
      </div>

      {/* Right: Anterior / Próxima Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="hero-cta-secondary px-3.5 py-1.5 text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#22E025]" />
          <span>Anterior</span>
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="hero-cta-secondary px-3.5 py-1.5 text-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <span>Próxima</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#22E025]" />
        </button>
      </div>

    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Check, Star, Download, ExternalLink, MessageSquare, FileText, Send, Sparkles } from 'lucide-react';
import { Lesson, Comment } from '../types';
import { fetchComments, postComment, submitLessonRating, toggleLessonComplete } from '../lib/api';

interface LessonDetailsProps {
  lesson: Lesson;
  onToggleComplete: () => void;
  isCompleted: boolean;
  userRating?: number;
}

export const LessonDetails: React.FC<LessonDetailsProps> = ({
  lesson,
  onToggleComplete,
  isCompleted,
  userRating = 0
}) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'materials' | 'comments'>('desc');
  const [rating, setRating] = useState<number>(userRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [completingLoading, setCompletingLoading] = useState(false);

  useEffect(() => {
    setRating(userRating);
  }, [userRating, lesson.id]);

  useEffect(() => {
    if (activeTab === 'comments') {
      loadComments();
    }
  }, [lesson.id, activeTab]);

  const loadComments = async () => {
    try {
      const list = await fetchComments(lesson.id);
      setComments(list);
    } catch (e) {
      // ignore
    }
  };

  const handleRatingSubmit = async (stars: number) => {
    setRating(stars);
    try {
      await submitLessonRating(lesson.id, stars);
    } catch (e) {
      // handle error
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const created = await postComment(lesson.id, newCommentText.trim());
      setComments([created, ...comments]);
      setNewCommentText('');
    } catch (e) {
      // handle error
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleCompleteAction = async () => {
    setCompletingLoading(true);
    try {
      await onToggleComplete();
    } finally {
      setCompletingLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      
      {/* Lesson Meta Row + Completion & Rating Action Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* Left 2 Cols: Duration & Title */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22E025]">
            <Clock className="w-4 h-4 text-[#22E025]" />
            <span>{lesson.durationMinutes} min</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
            {lesson.title}
          </h2>
        </div>

        {/* Right Col: Complete Button Only */}
        <div className="flex justify-start lg:justify-end">
          <button
            onClick={handleToggleCompleteAction}
            disabled={completingLoading}
            className={`py-3 px-6 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isCompleted
                ? 'hero-cta'
                : 'hero-cta-secondary'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#050E06]" />
                <span>Aula Concluída</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#22E025]" />
                <span>Marcar como Concluída</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#1E272B] flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('desc')}
          className={`pb-3 flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === 'desc'
              ? 'border-[#22E025] text-[#22E025]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Descrição & Anotações
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === 'materials'
              ? 'border-[#22E025] text-[#22E025]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          Material Complementar ({lesson.attachments?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`pb-3 flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === 'comments'
              ? 'border-[#22E025] text-[#22E025]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Dúvidas & Comentários
        </button>
      </div>

      {/* Tab Content 1: Description & Notes */}
      {activeTab === 'desc' && (
        <div className="adsata-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#22E025] uppercase tracking-wider mb-2">Resumo da Aula</h3>
            <p className="text-sm text-gray-200 leading-relaxed font-normal whitespace-pre-line">
              {lesson.description}
            </p>
          </div>

          {lesson.notes && (
            <div className="pt-4 border-t border-[#1E272B]">
              <h3 className="text-xs font-bold text-[#22E025] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#22E025]" />
                Anotações Importantes do Mentor
              </h3>
              <div className="bg-[#0B0F10] border border-[#1E272B] rounded-xl p-3.5 text-xs text-gray-300 leading-relaxed whitespace-pre-line font-mono">
                {lesson.notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Materials & Downloads */}
      {activeTab === 'materials' && (
        <div className="adsata-card p-5">
          {lesson.attachments && lesson.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lesson.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-3.5 rounded-xl bg-[#0B0F10] border border-[#1E272B] hover:border-[#22E025]/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#153A2D] border border-[#22E025]/30 flex items-center justify-center text-[#22E025] group-hover:scale-105 transition-transform">
                      {att.fileType === 'pdf' ? (
                        <FileText className="w-5 h-5 text-[#22E025]" />
                      ) : att.fileType === 'link' ? (
                        <ExternalLink className="w-5 h-5 text-[#22E025]" />
                      ) : (
                        <Download className="w-5 h-5 text-[#22E025]" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#22E025] transition-colors">
                        {att.title}
                      </p>
                      {att.fileSize && (
                        <p className="text-[10px] text-gray-500">{att.fileSize}</p>
                      )}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-500 group-hover:text-[#22E025]" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">
              Nenhum arquivo ou material anexado a esta aula.
            </p>
          )}
        </div>
      )}

      {/* Tab Content 3: Comments & Q&A Thread */}
      {activeTab === 'comments' && (
        <div className="adsata-card p-5 space-y-5">
          
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="space-y-3">
            <label className="block text-xs font-semibold text-gray-300">
              Enviar Dúvida ou Comentário para a Comunidade
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva sua dúvida referente a esta aula..."
                className="flex-1 adsata-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !newCommentText.trim()}
                className="hero-cta px-4 py-2.5 text-xs disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-[#050E06]" />
                Enviar
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-3.5 rounded-xl bg-[#0B0F10] border border-[#1E272B] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#153A2D] border border-[#22E025]/40 text-[#22E025] font-bold text-[10px] flex items-center justify-center">
                        {comment.avatarInitials || 'AL'}
                      </div>
                      <span className="text-xs font-bold text-white">{comment.userName}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 pl-9 font-normal">
                    {comment.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                Seja o primeiro a deixar um comentário nesta aula!
              </p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

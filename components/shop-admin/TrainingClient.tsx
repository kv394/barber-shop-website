'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = 'techniques' | 'customer-service' | 'product-knowledge' | 'health-safety';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  durationMinutes: number;
  videoUrl?: string;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  lessons: Lesson[];
  quiz: QuizQuestion[];
  createdAt: string;
}

interface LessonProgress {
  lessonId: string;
  completedAt: string;
}

interface QuizAttempt {
  moduleId: string;
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
}

interface TrainingProgress {
  moduleId: string;
  lessonsCompleted: LessonProgress[];
  quizAttempts: QuizAttempt[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<Category, { label: string; emoji: string; color: string; accent: string; bgAccent: string }> = {
  'techniques': { label: 'Cutting Techniques', emoji: '✂️', color: 'text-blue-500', accent: 'bg-blue-500/10 border-blue-500/20', bgAccent: 'from-blue-500 to-blue-400' },
  'customer-service': { label: 'Customer Service', emoji: '🤝', color: 'text-emerald-500', accent: 'bg-emerald-500/10 border-emerald-500/20', bgAccent: 'from-emerald-500 to-emerald-400' },
  'product-knowledge': { label: 'Product Knowledge', emoji: '🧴', color: 'text-amber-500', accent: 'bg-amber-500/10 border-amber-500/20', bgAccent: 'from-amber-500 to-amber-400' },
  'health-safety': { label: 'Health & Safety', emoji: '🛡️', color: 'text-red-500', accent: 'bg-red-500/10 border-red-500/20', bgAccent: 'from-red-500 to-red-400' },
};

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  'beginner': { label: 'Beginner', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'intermediate': { label: 'Intermediate', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'advanced': { label: 'Advanced', color: 'bg-red-50 text-red-700 border-red-200' },
};

const PASS_THRESHOLD = 0.7;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function storageKey(shopId: string, suffix: string) { return `training_${shopId}_${suffix}`; }

function loadModules(shopId: string): TrainingModule[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(storageKey(shopId, 'modules')) || '[]'); } catch { return []; }
}
function saveModules(shopId: string, m: TrainingModule[]) {
  localStorage.setItem(storageKey(shopId, 'modules'), JSON.stringify(m));
}
function loadProgress(shopId: string): TrainingProgress[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(storageKey(shopId, 'progress')) || '[]'); } catch { return []; }
}
function saveProgress(shopId: string, p: TrainingProgress[]) {
  localStorage.setItem(storageKey(shopId, 'progress'), JSON.stringify(p));
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

/** Animated circular progress ring */
function ProgressRing({ percent, size = 56, strokeWidth = 5, className = '' }: { percent: number; size?: number; strokeWidth?: number; className?: string }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 100 ? '#16A34A' : percent >= 50 ? '#F59E0B' : '#3B82F6';
  return (
    <svg width={size} height={size} className={`-rotate-90 ${className}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-700 ease-out" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center fill-crm-text text-[11px] font-black">
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

/** Module card shown in the grid */
function ModuleCard({ module, progress, onClick, onDelete, isAdmin }: {
  module: TrainingModule; progress?: TrainingProgress; onClick: () => void; onDelete?: () => void; isAdmin: boolean;
}) {
  const cat = CATEGORY_META[module.category];
  const diff = DIFFICULTY_META[module.difficulty];
  const totalLessons = module.lessons.length;
  const completedLessons = progress?.lessonsCompleted.length || 0;
  const percent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const bestQuiz = progress?.quizAttempts.length ? Math.max(...progress.quizAttempts.map(a => a.score / a.total * 100)) : null;
  const totalDuration = module.lessons.reduce((s, l) => s + l.durationMinutes, 0);

  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <PremiumGlassCard className="!p-0 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
        {/* Category gradient header */}
        <div className={`h-2 bg-gradient-to-r ${cat.bgAccent}`} />
        <div className="p-5 flex flex-col h-full">
          {/* Top row: category + difficulty */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-black uppercase tracking-widest ${cat.color}`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.color}`}>
              {diff.label}
            </span>
          </div>

          {/* Title + description */}
          <h3 className="text-[15px] font-bold text-crm-text mb-1.5 line-clamp-2 group-hover:text-crm-primary transition-colors">{module.title}</h3>
          <p className="text-[12px] text-crm-muted line-clamp-2 mb-4 flex-1">{module.description}</p>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[11px] text-crm-muted font-medium mb-4">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              {totalLessons} lesson{totalLessons !== 1 ? 's' : ''}
            </span>
            {module.quiz.length > 0 && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {module.quiz.length} quiz Q{module.quiz.length !== 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {totalDuration}min
            </span>
          </div>

          {/* Progress / quiz score footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/20">
            {totalLessons > 0 ? (
              <div className="flex items-center gap-3">
                <ProgressRing percent={percent} size={40} strokeWidth={4} />
                <div>
                  <p className="text-[11px] font-bold text-crm-text">{completedLessons}/{totalLessons} done</p>
                  {bestQuiz !== null && (
                    <p className={`text-[10px] font-bold ${bestQuiz >= PASS_THRESHOLD * 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Quiz: {Math.round(bestQuiz)}%
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-[11px] text-crm-muted italic">No lessons yet</span>
            )}

            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 text-crm-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete module"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            )}
          </div>
        </div>
      </PremiumGlassCard>
    </div>
  );
}

// ─── Module Builder (Admin) ──────────────────────────────────────────────────

function ModuleBuilder({ initial, onSave, onCancel }: { initial?: TrainingModule; onSave: (m: TrainingModule) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState<Category>(initial?.category || 'techniques');
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty || 'beginner');
  const [lessons, setLessons] = useState<Lesson[]>(initial?.lessons || []);
  const [quiz, setQuiz] = useState<QuizQuestion[]>(initial?.quiz || []);
  const [activeTab, setActiveTab] = useState<'details' | 'lessons' | 'quiz'>('details');

  const addLesson = () => {
    setLessons([...lessons, { id: uid(), title: '', content: '', durationMinutes: 10 }]);
    setActiveTab('lessons');
  };

  const updateLesson = (idx: number, patch: Partial<Lesson>) => {
    const updated = [...lessons];
    updated[idx] = { ...updated[idx], ...patch };
    setLessons(updated);
  };

  const removeLesson = (idx: number) => setLessons(lessons.filter((_, i) => i !== idx));

  const addQuestion = () => {
    setQuiz([...quiz, { id: uid(), question: '', options: ['', '', '', ''], correctIndex: 0 }]);
    setActiveTab('quiz');
  };

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    const updated = [...quiz];
    updated[idx] = { ...updated[idx], ...patch };
    setQuiz(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...quiz];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuiz(updated);
  };

  const removeQuestion = (idx: number) => setQuiz(quiz.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id || uid(),
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      lessons: lessons.filter(l => l.title.trim()),
      quiz: quiz.filter(q => q.question.trim() && q.options.some(o => o.trim())),
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  const tabs = [
    { id: 'details' as const, label: 'Details' },
    { id: 'lessons' as const, label: `Lessons (${lessons.length})` },
    { id: 'quiz' as const, label: `Quiz (${quiz.length})` },
  ];

  const inputClass = "w-full bg-crm-bg/50 backdrop-blur-sm border border-crm-border rounded-xl px-4 py-3 text-[13px] text-crm-text placeholder:text-crm-muted/60 focus:outline-none focus:ring-2 focus:ring-crm-primary/30 focus:border-crm-primary/50 transition-all";
  const labelClass = "block text-[11px] font-black text-crm-muted uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-6 animate-page-in">
      {/* Back button */}
      <button onClick={onCancel} className="flex items-center gap-2 text-crm-muted hover:text-crm-text text-[13px] font-bold transition-colors group">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Modules
      </button>

      <h2 className="text-xl font-black text-crm-text tracking-tight">
        {initial ? 'Edit Module' : 'Create Training Module'}
      </h2>

      {/* Tab bar */}
      <div className="flex gap-1 bg-crm-bg/80 p-1 rounded-xl border border-crm-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-[12px] font-bold transition-all ${activeTab === t.id ? 'bg-white text-crm-text shadow-sm' : 'text-crm-muted hover:text-crm-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Module Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Fade Techniques Masterclass" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What will staff learn in this module?" rows={3} className={inputClass + ' resize-none'} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as Category)} className={inputClass}>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className={inputClass}>
                {Object.entries(DIFFICULTY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lessons tab */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          {lessons.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
              <span className="text-3xl mb-3 opacity-50">📖</span>
              <p className="text-crm-muted text-[13px] mb-4">No lessons yet. Add your first lesson.</p>
            </div>
          )}
          {lessons.map((lesson, idx) => (
            <PremiumGlassCard key={lesson.id} className="!p-4" accentColor="brand-indigo">
              <div className="flex items-start gap-3 mb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-indigo/10 text-brand-indigo text-[12px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                <div className="flex-1 space-y-3">
                  <input value={lesson.title} onChange={e => updateLesson(idx, { title: e.target.value })} placeholder="Lesson title" className={inputClass} />
                  <textarea value={lesson.content} onChange={e => updateLesson(idx, { content: e.target.value })} placeholder="Lesson content (text/instructions)..." rows={4} className={inputClass + ' resize-none'} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Duration (min)</label>
                      <input type="number" min={1} value={lesson.durationMinutes} onChange={e => updateLesson(idx, { durationMinutes: parseInt(e.target.value) || 1 })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Video URL (optional)</label>
                      <input value={lesson.videoUrl || ''} onChange={e => updateLesson(idx, { videoUrl: e.target.value })} placeholder="https://youtube.com/..." className={inputClass} />
                    </div>
                  </div>
                </div>
                <button onClick={() => removeLesson(idx)} className="p-2 text-crm-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Remove lesson">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </PremiumGlassCard>
          ))}
          <button onClick={addLesson} className="w-full py-3 rounded-xl border-2 border-dashed border-crm-border hover:border-crm-primary/50 text-crm-muted hover:text-crm-primary text-[13px] font-bold transition-all hover:bg-crm-primary/5">
            + Add Lesson
          </button>
        </div>
      )}

      {/* Quiz tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {quiz.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
              <span className="text-3xl mb-3 opacity-50">❓</span>
              <p className="text-crm-muted text-[13px] mb-4">No quiz questions yet. Add questions to test comprehension.</p>
            </div>
          )}
          {quiz.map((q, qIdx) => (
            <PremiumGlassCard key={q.id} className="!p-4" accentColor="crm-primary">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-crm-primary/10 text-crm-primary text-[12px] font-black flex items-center justify-center shrink-0">Q{qIdx + 1}</span>
                <div className="flex-1 space-y-3">
                  <input value={q.question} onChange={e => updateQuestion(qIdx, { question: e.target.value })} placeholder="Enter your question..." className={inputClass} />
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${q.correctIndex === oIdx ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-crm-border hover:border-emerald-400'}`}
                          title={q.correctIndex === oIdx ? 'Correct answer' : 'Mark as correct'}
                        >
                          {q.correctIndex === oIdx && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                        <input value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className={inputClass + ' flex-1'} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-crm-muted">Click the circle to mark the correct answer</p>
                </div>
                <button onClick={() => removeQuestion(qIdx)} className="p-2 text-crm-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Remove question">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </PremiumGlassCard>
          ))}
          <button onClick={addQuestion} className="w-full py-3 rounded-xl border-2 border-dashed border-crm-border hover:border-crm-primary/50 text-crm-muted hover:text-crm-primary text-[13px] font-bold transition-all hover:bg-crm-primary/5">
            + Add Question
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={!title.trim()}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-crm-primary to-crm-accent text-white font-black uppercase tracking-wider text-[13px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100">
          {initial ? 'Save Changes' : 'Create Module'}
        </button>
        <button onClick={onCancel} className="px-6 py-3 rounded-full bg-white/50 border border-white/40 text-crm-muted font-bold text-[13px] hover:text-crm-text hover:bg-white/80 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Module Detail / Lesson Viewer (Staff) ───────────────────────────────────

function ModuleViewer({ module, progress, onBack, onMarkComplete, onQuizSubmit }: {
  module: TrainingModule;
  progress: TrainingProgress;
  onBack: () => void;
  onMarkComplete: (lessonId: string) => void;
  onQuizSubmit: (answers: number[]) => void;
}) {
  const [activeView, setActiveView] = useState<'overview' | 'lesson' | 'quiz'>('overview');
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(module.quiz.length).fill(-1));
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const cat = CATEGORY_META[module.category];
  const diff = DIFFICULTY_META[module.difficulty];
  const completedIds = new Set(progress.lessonsCompleted.map(l => l.lessonId));
  const totalDuration = module.lessons.reduce((s, l) => s + l.durationMinutes, 0);
  const percent = module.lessons.length > 0 ? (completedIds.size / module.lessons.length) * 100 : 0;

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    onQuizSubmit(quizAnswers);
  };

  const latestAttempt = progress.quizAttempts.length > 0 ? progress.quizAttempts[progress.quizAttempts.length - 1] : null;

  // Quiz results view after submission
  if (activeView === 'quiz' && quizSubmitted) {
    const score = quizAnswers.reduce((s, a, i) => s + (a === module.quiz[i].correctIndex ? 1 : 0), 0);
    const pct = (score / module.quiz.length) * 100;
    const passed = pct >= PASS_THRESHOLD * 100;
    return (
      <div className="space-y-6 animate-page-in">
        <button onClick={() => { setActiveView('overview'); setQuizSubmitted(false); setQuizAnswers(new Array(module.quiz.length).fill(-1)); }} className="flex items-center gap-2 text-crm-muted hover:text-crm-text text-[13px] font-bold transition-colors group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Module
        </button>

        <div className="text-center py-8">
          <div className="text-6xl mb-4">{passed ? '🎉' : '📚'}</div>
          <h2 className="text-2xl font-black text-crm-text mb-2">{passed ? 'Congratulations!' : 'Keep Learning!'}</h2>
          <p className="text-crm-muted text-[14px] mb-6">
            You scored <span className={`font-black ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>{score}/{module.quiz.length}</span> ({Math.round(pct)}%)
            {passed ? ' — You passed!' : ` — ${Math.ceil(PASS_THRESHOLD * 100)}% needed to pass`}
          </p>
          <ProgressRing percent={pct} size={80} strokeWidth={6} />
        </div>

        {/* Show answers review */}
        <div className="space-y-3">
          {module.quiz.map((q, i) => {
            const correct = quizAnswers[i] === q.correctIndex;
            return (
              <PremiumGlassCard key={q.id} className="!p-4" accentColor={correct ? 'emerald-500' : 'red-500'}>
                <p className="text-[13px] font-bold text-crm-text mb-2">{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg border ${
                      oIdx === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' :
                      oIdx === quizAnswers[i] && !correct ? 'bg-red-50 border-red-200 text-red-700 line-through' :
                      'border-transparent text-crm-muted'
                    }`}>
                      {oIdx === q.correctIndex && <span className="text-emerald-600">✓</span>}
                      {oIdx === quizAnswers[i] && !correct && <span className="text-red-500">✗</span>}
                      {opt}
                    </div>
                  ))}
                </div>
              </PremiumGlassCard>
            );
          })}
        </div>
      </div>
    );
  }

  // Lesson viewer
  if (activeView === 'lesson' && module.lessons[activeLessonIdx]) {
    const lesson = module.lessons[activeLessonIdx];
    const isComplete = completedIds.has(lesson.id);
    return (
      <div className="space-y-6 animate-page-in">
        <button onClick={() => setActiveView('overview')} className="flex items-center gap-2 text-crm-muted hover:text-crm-text text-[13px] font-bold transition-colors group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Module
        </button>

        {/* Lesson nav pills */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
          {module.lessons.map((l, i) => (
            <button key={l.id} onClick={() => setActiveLessonIdx(i)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                i === activeLessonIdx ? 'bg-crm-primary text-white shadow' :
                completedIds.has(l.id) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-white/50 text-crm-muted border border-crm-border hover:border-crm-primary/30'
              }`}>
              {completedIds.has(l.id) && i !== activeLessonIdx && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {i + 1}. {l.title || `Lesson ${i + 1}`}
            </button>
          ))}
        </div>

        <PremiumGlassCard accentColor="brand-indigo">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-black text-brand-indigo uppercase tracking-widest mb-1">Lesson {activeLessonIdx + 1} of {module.lessons.length}</p>
              <h3 className="text-lg font-bold text-crm-text">{lesson.title}</h3>
            </div>
            <span className="text-[11px] text-crm-muted font-medium flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {lesson.durationMinutes} min
            </span>
          </div>

          {/* Video embed */}
          {lesson.videoUrl && (
            <div className="mb-5 rounded-xl overflow-hidden bg-black/5 border border-crm-border">
              {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={lesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-8 text-crm-primary hover:text-crm-accent text-[13px] font-bold transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Watch Video
                </a>
              )}
            </div>
          )}

          {/* Lesson content */}
          <div className="prose prose-sm max-w-none text-crm-text text-[14px] leading-relaxed whitespace-pre-wrap mb-6">
            {lesson.content}
          </div>

          {/* Mark complete button */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            {isComplete ? (
              <span className="flex items-center gap-2 text-emerald-600 text-[13px] font-bold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Completed
              </span>
            ) : (
              <button onClick={() => onMarkComplete(lesson.id)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black uppercase tracking-wider text-[12px] shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                ✓ Mark as Complete
              </button>
            )}
            {/* Next lesson */}
            {activeLessonIdx < module.lessons.length - 1 && (
              <button onClick={() => setActiveLessonIdx(activeLessonIdx + 1)}
                className="flex items-center gap-1 text-crm-muted hover:text-crm-primary text-[13px] font-bold transition-colors">
                Next Lesson
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>
        </PremiumGlassCard>
      </div>
    );
  }

  // Quiz taking view
  if (activeView === 'quiz' && !quizSubmitted) {
    return (
      <div className="space-y-6 animate-page-in">
        <button onClick={() => setActiveView('overview')} className="flex items-center gap-2 text-crm-muted hover:text-crm-text text-[13px] font-bold transition-colors group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Module
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-crm-text tracking-tight">📝 Quiz: {module.title}</h2>
          <span className="text-[12px] text-crm-muted font-bold">{module.quiz.length} questions • {Math.ceil(PASS_THRESHOLD * 100)}% to pass</span>
        </div>

        <div className="space-y-4">
          {module.quiz.map((q, qIdx) => (
            <PremiumGlassCard key={q.id} className="!p-5" accentColor="crm-primary">
              <p className="text-[14px] font-bold text-crm-text mb-3">{qIdx + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <button key={oIdx} onClick={() => { const a = [...quizAnswers]; a[qIdx] = oIdx; setQuizAnswers(a); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-[13px] font-medium transition-all ${
                      quizAnswers[qIdx] === oIdx
                        ? 'border-crm-primary bg-crm-primary/5 text-crm-text font-bold'
                        : 'border-crm-border hover:border-crm-primary/30 text-crm-muted hover:text-crm-text'
                    }`}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 mr-3 text-[11px] font-black ${
                      quizAnswers[qIdx] === oIdx ? 'border-crm-primary bg-crm-primary text-white' : 'border-crm-border'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </PremiumGlassCard>
          ))}
        </div>

        <button onClick={handleQuizSubmit} disabled={quizAnswers.some(a => a === -1)}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-crm-primary to-crm-accent text-white font-black uppercase tracking-wider text-[13px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100">
          Submit Quiz
        </button>
      </div>
    );
  }

  // Module overview
  return (
    <div className="space-y-6 animate-page-in">
      <button onClick={onBack} className="flex items-center gap-2 text-crm-muted hover:text-crm-text text-[13px] font-bold transition-colors group">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"/></svg>
        Back to All Modules
      </button>

      {/* Module header */}
      <div className={`rounded-2xl p-6 bg-gradient-to-br ${cat.accent} border relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[11px] font-black uppercase tracking-widest ${cat.color}`}>{cat.emoji} {cat.label}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff.color}`}>{diff.label}</span>
          </div>
          <h2 className="text-2xl font-black text-crm-text mb-2">{module.title}</h2>
          <p className="text-[14px] text-crm-muted max-w-2xl">{module.description}</p>
          <div className="flex items-center gap-6 mt-4">
            <ProgressRing percent={percent} size={56} strokeWidth={5} />
            <div className="flex gap-6 text-[12px] text-crm-muted">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span className="font-bold text-crm-text">{completedIds.size}/{module.lessons.length}</span> lessons
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="font-bold text-crm-text">{totalDuration}</span> min total
              </span>
              {latestAttempt && (
                <span className={`font-bold ${latestAttempt.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Quiz: {Math.round(latestAttempt.score / latestAttempt.total * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div>
        <h3 className="text-[15px] font-black text-crm-text mb-3 flex items-center gap-2">
          📖 Lessons
        </h3>
        <div className="space-y-2">
          {module.lessons.map((lesson, idx) => {
            const done = completedIds.has(lesson.id);
            return (
              <button key={lesson.id} onClick={() => { setActiveLessonIdx(idx); setActiveView('lesson'); }}
                className={`w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl border transition-all hover:-translate-x-0.5 ${
                  done ? 'bg-emerald-50/50 border-emerald-200/50 hover:border-emerald-300' : 'bg-white/30 border-white/30 hover:border-crm-primary/30 hover:bg-white/50'
                }`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  done ? 'bg-emerald-500 text-white' : 'bg-crm-bg border-2 border-crm-border text-crm-muted'
                }`}>
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span className="text-[12px] font-black">{idx + 1}</span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold truncate ${done ? 'text-emerald-800' : 'text-crm-text'}`}>{lesson.title || `Lesson ${idx + 1}`}</p>
                  <p className="text-[11px] text-crm-muted">{lesson.durationMinutes} min{lesson.videoUrl ? ' • Has video' : ''}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiz section */}
      {module.quiz.length > 0 && (
        <div>
          <h3 className="text-[15px] font-black text-crm-text mb-3 flex items-center gap-2">
            📝 Knowledge Quiz
          </h3>
          <PremiumGlassCard className="!p-5" accentColor="crm-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-crm-text mb-1">{module.quiz.length} question{module.quiz.length !== 1 ? 's' : ''}</p>
                <p className="text-[12px] text-crm-muted">Score {Math.ceil(PASS_THRESHOLD * 100)}% or higher to pass</p>
                {latestAttempt && (
                  <p className={`text-[12px] font-bold mt-1 ${latestAttempt.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                    Last attempt: {Math.round(latestAttempt.score / latestAttempt.total * 100)}% — {latestAttempt.passed ? 'Passed ✓' : 'Not passed'}
                  </p>
                )}
              </div>
              <button onClick={() => { setQuizAnswers(new Array(module.quiz.length).fill(-1)); setQuizSubmitted(false); setActiveView('quiz'); }}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-crm-primary to-crm-accent text-white font-black uppercase tracking-wider text-[11px] shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                {latestAttempt ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          </PremiumGlassCard>
        </div>
      )}
    </div>
  );
}

// ─── Admin Progress Dashboard ────────────────────────────────────────────────

function AdminProgressDashboard({ modules, allProgress }: { modules: TrainingModule[]; allProgress: TrainingProgress[] }) {
  if (modules.length === 0) return null;

  const progressMap = new Map(allProgress.map(p => [p.moduleId, p]));

  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-black text-crm-text flex items-center gap-2">
        📊 Training Overview
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Modules', value: modules.length, color: 'text-blue-500', accent: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Total Lessons', value: modules.reduce((s, m) => s + m.lessons.length, 0), color: 'text-purple-500', accent: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Quiz Questions', value: modules.reduce((s, m) => s + m.quiz.length, 0), color: 'text-amber-500', accent: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Completed', value: allProgress.filter(p => {
            const mod = modules.find(m => m.id === p.moduleId);
            return mod && p.lessonsCompleted.length >= mod.lessons.length;
          }).length, color: 'text-emerald-500', accent: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white/40 border border-white/20 p-4 rounded-2xl text-center shadow-inner relative overflow-hidden group`}>
            <div className={`absolute inset-0 ${stat.accent} opacity-50 transition-opacity group-hover:opacity-100`} />
            <div className="relative z-10">
              <p className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-black text-crm-muted uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TrainingClient({ shopId, userRole }: { shopId: string; userRole: string }) {
  const isAdmin = userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN';
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [view, setView] = useState<'list' | 'builder' | 'detail'>('list');
  const [editingModule, setEditingModule] = useState<TrainingModule | undefined>();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setModules(loadModules(shopId));
    setProgress(loadProgress(shopId));
    setMounted(true);
  }, [shopId]);

  // Persist
  const persistModules = useCallback((m: TrainingModule[]) => { setModules(m); saveModules(shopId, m); }, [shopId]);
  const persistProgress = useCallback((p: TrainingProgress[]) => { setProgress(p); saveProgress(shopId, p); }, [shopId]);

  // Handlers
  const handleSaveModule = (mod: TrainingModule) => {
    const existing = modules.findIndex(m => m.id === mod.id);
    const updated = existing >= 0 ? modules.map(m => m.id === mod.id ? mod : m) : [...modules, mod];
    persistModules(updated);
    setView('list');
    setEditingModule(undefined);
  };

  const handleDeleteModule = (id: string) => {
    persistModules(modules.filter(m => m.id !== id));
    persistProgress(progress.filter(p => p.moduleId !== id));
  };

  const handleMarkLessonComplete = (lessonId: string) => {
    if (!activeModuleId) return;
    const existing = progress.find(p => p.moduleId === activeModuleId);
    if (existing) {
      if (existing.lessonsCompleted.some(l => l.lessonId === lessonId)) return;
      const updated = progress.map(p => p.moduleId === activeModuleId ? {
        ...p,
        lessonsCompleted: [...p.lessonsCompleted, { lessonId, completedAt: new Date().toISOString() }],
      } : p);
      persistProgress(updated);
    } else {
      persistProgress([...progress, {
        moduleId: activeModuleId,
        lessonsCompleted: [{ lessonId, completedAt: new Date().toISOString() }],
        quizAttempts: [],
      }]);
    }
  };

  const handleQuizSubmit = (answers: number[]) => {
    if (!activeModuleId) return;
    const mod = modules.find(m => m.id === activeModuleId);
    if (!mod) return;
    const score = answers.reduce((s, a, i) => s + (a === mod.quiz[i].correctIndex ? 1 : 0), 0);
    const attempt: QuizAttempt = {
      moduleId: activeModuleId,
      score,
      total: mod.quiz.length,
      passed: (score / mod.quiz.length) >= PASS_THRESHOLD,
      completedAt: new Date().toISOString(),
    };

    const existing = progress.find(p => p.moduleId === activeModuleId);
    if (existing) {
      const updated = progress.map(p => p.moduleId === activeModuleId ? {
        ...p, quizAttempts: [...p.quizAttempts, attempt],
      } : p);
      persistProgress(updated);
    } else {
      persistProgress([...progress, {
        moduleId: activeModuleId,
        lessonsCompleted: [],
        quizAttempts: [attempt],
      }]);
    }
  };

  const openModule = (id: string) => { setActiveModuleId(id); setView('detail'); };

  const activeModule = modules.find(m => m.id === activeModuleId);
  const activeProgress = progress.find(p => p.moduleId === activeModuleId) || { moduleId: activeModuleId || '', lessonsCompleted: [], quizAttempts: [] };

  const filteredModules = filterCategory === 'all' ? modules : modules.filter(m => m.category === filterCategory);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-crm-primary/20 border-t-crm-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Module Detail View ──
  if (view === 'detail' && activeModule) {
    return (
      <ModuleViewer
        module={activeModule}
        progress={activeProgress}
        onBack={() => { setView('list'); setActiveModuleId(null); }}
        onMarkComplete={handleMarkLessonComplete}
        onQuizSubmit={handleQuizSubmit}
      />
    );
  }

  // ── Module Builder View ──
  if (view === 'builder') {
    return (
      <ModuleBuilder
        initial={editingModule}
        onSave={handleSaveModule}
        onCancel={() => { setView('list'); setEditingModule(undefined); }}
      />
    );
  }

  // ── Module List View ──
  return (
    <div className="space-y-8 animate-page-in">
      {/* Admin overview stats */}
      {isAdmin && <AdminProgressDashboard modules={modules} allProgress={progress} />}

      {/* Header + Create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-crm-text tracking-tight flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            {isAdmin ? 'Training Modules' : 'My Training'}
          </h2>
          <p className="text-[13px] text-crm-muted mt-1">
            {isAdmin ? 'Create and manage training content for your team' : 'Browse and complete training to level up your skills'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingModule(undefined); setView('builder'); }}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-crm-primary to-crm-accent text-white font-black uppercase tracking-wider text-[13px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all self-start">
            + New Module
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setFilterCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${
            filterCategory === 'all' ? 'bg-crm-text text-white border-crm-text' : 'bg-white/50 text-crm-muted border-crm-border hover:border-crm-text/30'
          }`}>
          All
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button key={key} onClick={() => setFilterCategory(key as Category)}
            className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${
              filterCategory === key ? `${meta.accent} ${meta.color} border-current` : 'bg-white/50 text-crm-muted border-crm-border hover:border-crm-text/30'
            }`}>
            {meta.emoji} {meta.label}
          </button>
        ))}
      </div>

      {/* Module grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map(mod => (
            <ModuleCard
              key={mod.id}
              module={mod}
              progress={progress.find(p => p.moduleId === mod.id)}
              onClick={() => isAdmin ? (() => { setEditingModule(mod); setView('builder'); })() : openModule(mod.id)}
              onDelete={isAdmin ? () => handleDeleteModule(mod.id) : undefined}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
          <span className="text-5xl mb-4 opacity-50 drop-shadow-md">🎓</span>
          <p className="text-crm-muted text-[15px] font-medium max-w-[300px] mx-auto mb-2">
            {modules.length === 0
              ? (isAdmin ? 'No training modules yet' : 'No training modules available')
              : 'No modules match this filter'}
          </p>
          {isAdmin && modules.length === 0 && (
            <p className="text-crm-muted/70 text-[12px] mb-4">Create your first module to start training your team</p>
          )}
          {isAdmin && modules.length === 0 && (
            <button onClick={() => { setEditingModule(undefined); setView('builder'); }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-crm-primary to-crm-accent text-white font-black uppercase tracking-wider text-[12px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              + Create First Module
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz } from '../../types';
import { soundManager } from '../../services/audioEffects';
import { useApp } from '../../context/AppContext';
import { Clock, CheckCircle2, XCircle, ArrowLeft, ArrowRight, HelpCircle, Sparkles } from 'lucide-react';
import { getSafeErrorMessage } from '../../utils/apiHelper';

interface MultipleChoiceGameProps {
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (resultId: string) => void;
  onBack: () => void;
}

export const MultipleChoiceGame: React.FC<MultipleChoiceGameProps> = ({
  quiz,
  studentName,
  studentClass,
  onFinish,
  onBack
}) => {
  const { showToast, currentUser } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [revealedExplanations, setRevealedExplanations] = useState<{ [qId: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState<number>(quiz.settings.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());

  const currentQuestion = quiz.questions[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    soundManager.playClick();
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option
    }));

    if (quiz.settings.immediateFeedback) {
      setRevealedExplanations(prev => ({
        ...prev,
        [currentQuestion.id]: true
      }));
      if (option.toUpperCase() === currentQuestion.answer.toUpperCase()) {
        soundManager.playCorrect();
      } else {
        soundManager.playWrong();
      }
    }
  };

  // Keyboard shortcut listener for A, B, C, D / 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      const opts = currentQuestion.options;
      if (e.key === '1' || e.key.toLowerCase() === 'a') {
        if (opts[0]) handleSelectOption(opts[0]);
      } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
        if (opts[1]) handleSelectOption(opts[1]);
      } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
        if (opts[2]) handleSelectOption(opts[2]);
      } else if (e.key === '4' || e.key.toLowerCase() === 'd') {
        if (opts[3]) handleSelectOption(opts[3]);
      } else if (e.key === 'ArrowRight' && currentIndex < quiz.questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const clientTimeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const userAnswers: Record<string, { answer: string; hintsUsed: number; timeSpent: number }> = {};

    quiz.questions.forEach(q => {
      userAnswers[q.id] = {
        answer: selectedAnswers[q.id] || '',
        hintsUsed: 0,
        timeSpent: Math.round(clientTimeSpent / quiz.questions.length)
      };
    });

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          studentClass,
          userId: currentUser.role === 'SISWA' ? currentUser.id : undefined,
          userAnswers,
          clientTimeSpent
        })
      });

      if (!res.ok) {
        const errMsg = await getSafeErrorMessage(res, 'Gagal mengirim jawaban kuis');
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.success && data.result) {
        soundManager.playVictory();
        confetti({ particleCount: 100, spread: 70 });
        onFinish(data.result.id);
      }
    } catch (err: any) {
      showToast('Gagal mengirim jawaban: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Top Bar */}
      <div className="bg-white border-b border-emerald-100 py-3 px-4 sm:px-6 shadow-xs sticky top-16 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              PILIHAN GANDA • {studentClass}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {quiz.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Memeriksa...' : 'Selesai'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Question Number Pills Navigation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
          {quiz.questions.map((q, idx) => {
            const isAnswered = Boolean(selectedAnswers[q.id]);
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={`nav_${q.id}`}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Soal No. {currentIndex + 1} dari {quiz.questions.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Level: {currentQuestion.cognitiveLevel || 'C3'} • Kesulitan: {currentQuestion.difficulty}
              </span>
            </div>

            <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
              {currentQuestion.question}
            </p>

            {/* Options List (A, B, C, D) */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, optIdx) => {
                const label = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                const isSelected = selectedAnswers[currentQuestion.id] === opt;
                const isRevealed = revealedExplanations[currentQuestion.id];
                const isCorrect = opt.toUpperCase() === currentQuestion.answer.toUpperCase();

                let style = 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-800';
                if (isSelected && !isRevealed) {
                  style = 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600';
                } else if (isRevealed) {
                  if (isCorrect) {
                    style = 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold';
                  } else if (isSelected && !isCorrect) {
                    style = 'bg-rose-50 border-rose-400 text-rose-950';
                  }
                }

                return (
                  <button
                    key={`opt_${optIdx}`}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${style}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {label}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                    </div>

                    {isRevealed && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isRevealed && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Immediate Explanation Box */}
            {revealedExplanations[currentQuestion.id] && currentQuestion.explanation && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                <span className="font-bold flex items-center gap-1 text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Pembahasan Edukatif:
                </span>
                <p className="leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              {currentIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Berikutnya
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Kirim Jawaban
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

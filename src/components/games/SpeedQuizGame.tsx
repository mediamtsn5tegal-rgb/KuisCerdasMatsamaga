import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz } from '../../types';
import { soundManager } from '../../services/audioEffects';
import { useApp } from '../../context/AppContext';
import { Zap, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface SpeedQuizGameProps {
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (resultId: string) => void;
  onBack: () => void;
}

const QUESTION_SECONDS = 10;

export const SpeedQuizGame: React.FC<SpeedQuizGameProps> = ({
  quiz,
  studentName,
  studentClass,
  onFinish,
  onBack
}) => {
  const { showToast, currentUser } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(QUESTION_SECONDS);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState<{ [qId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = quiz.questions[currentIndex];

  // Per-question countdown
  useEffect(() => {
    setQuestionSecondsLeft(QUESTION_SECONDS);
    const interval = setInterval(() => {
      setQuestionSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleTimeExpire = () => {
    soundManager.playWrong();
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finalizeGame();
    }
  };

  const handleSelectOption = (opt: string) => {
    if (!currentQuestion) return;
    const timeSpent = QUESTION_SECONDS - questionSecondsLeft;

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: opt
    }));

    setQuestionTimeSpent(prev => ({
      ...prev,
      [currentQuestion.id]: timeSpent
    }));

    if (opt.toUpperCase() === currentQuestion.answer.toUpperCase()) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    if (currentIndex < quiz.questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 350);
    } else {
      setTimeout(() => {
        finalizeGame();
      }, 350);
    }
  };

  const finalizeGame = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const clientTimeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const userAnswers: Record<string, { answer: string; hintsUsed: number; timeSpent: number }> = {};

    quiz.questions.forEach(q => {
      userAnswers[q.id] = {
        answer: selectedAnswers[q.id] || '',
        hintsUsed: 0,
        timeSpent: questionTimeSpent[q.id] || QUESTION_SECONDS
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

      const data = await res.json();
      if (data.success && data.result) {
        soundManager.playVictory();
        confetti({ particleCount: 100, spread: 70 });
        onFinish(data.result.id);
      }
    } catch (err: any) {
      showToast('Gagal mengirim kuis: ' + err.message, 'error');
      setIsSubmitting(false);
    }
  };

  const timerPercent = (questionSecondsLeft / QUESTION_SECONDS) * 100;
  let barColor = 'bg-emerald-500';
  if (questionSecondsLeft <= 3) barColor = 'bg-rose-500';
  else if (questionSecondsLeft <= 6) barColor = 'bg-amber-500';

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
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              KUIS CEPAT 10 DETIK • {studentClass}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {quiz.title}
            </h2>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          Soal {currentIndex + 1} / {quiz.questions.length}
        </div>
      </div>

      {/* Countdown Timer Bar */}
      <div className="w-full bg-slate-100 h-3">
        <div
          className={`h-full ${barColor} transition-all duration-1000 ease-linear`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center space-y-6">
        {currentQuestion && (
          <div className="bg-white rounded-3xl border-2 border-emerald-100 p-6 sm:p-8 shadow-xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-amber-500/30">
                {questionSecondsLeft}s
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cepat & Tepat
              </span>
            </div>

            <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug text-center py-2">
              {currentQuestion.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt, optIdx) => (
                <button
                  key={`sq_opt_${optIdx}`}
                  onClick={() => handleSelectOption(opt)}
                  className="p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all text-left font-semibold text-sm text-slate-800 flex items-center gap-3 shadow-xs"
                >
                  <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {['A', 'B', 'C', 'D'][optIdx]}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz } from '../../types';
import { soundManager } from '../../services/audioEffects';
import { useApp } from '../../context/AppContext';
import { Clock, ArrowLeft, ZoomIn, X, Lightbulb, CheckCircle, ArrowRight } from 'lucide-react';

interface PictureGuessGameProps {
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (resultId: string) => void;
  onBack: () => void;
}

export const PictureGuessGame: React.FC<PictureGuessGameProps> = ({
  quiz,
  studentName,
  studentClass,
  onFinish,
  onBack
}) => {
  const { showToast, currentUser } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswers, setTypedAnswers] = useState<{ [qId: string]: string }>({});
  const [hintsUsed, setHintsUsed] = useState<{ [qId: string]: number }>({});
  const [zoomImage, setZoomImage] = useState<string | null>(null);
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

  const handleInputChange = (val: string) => {
    if (!currentQuestion) return;
    setTypedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: val.toUpperCase()
    }));
  };

  const handleUseHint = () => {
    if (!currentQuestion) return;
    const currentHints = hintsUsed[currentQuestion.id] || 0;
    const cleanAnswer = currentQuestion.answer.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const currentTyped = (typedAnswers[currentQuestion.id] || '').toUpperCase();

    // Reveal next character
    const nextChar = cleanAnswer[currentTyped.length] || cleanAnswer[0];
    const newAnswer = currentTyped + nextChar;

    setTypedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer
    }));

    setHintsUsed(prev => ({
      ...prev,
      [currentQuestion.id]: currentHints + 1
    }));

    soundManager.playClick();
    showToast(`Huruf petunjuk "${nextChar}" ditambahkan (-3 poin)`, 'info');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const clientTimeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const userAnswers: Record<string, { answer: string; hintsUsed: number; timeSpent: number }> = {};

    quiz.questions.forEach(q => {
      userAnswers[q.id] = {
        answer: typedAnswers[q.id] || '',
        hintsUsed: hintsUsed[q.id] || 0,
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
              TEBAK GAMBAR • {studentClass}
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
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Memeriksa...' : 'Selesai'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {currentQuestion && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Gambar {currentIndex + 1} dari {quiz.questions.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Panjang Jawaban: {currentQuestion.answer.length} Huruf
              </span>
            </div>

            {/* Image Preview with Zoom Feature */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video max-h-72 flex items-center justify-center group shadow-inner">
              <img
                src={currentQuestion.imageUrl || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80'}
                alt="Pertanyaan Tebak Gambar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => setZoomImage(currentQuestion.imageUrl || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80')}
                className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-900 transition-colors backdrop-blur-xs flex items-center gap-1.5 text-xs font-semibold"
              >
                <ZoomIn className="w-4 h-4" />
                Perbesar Gambar
              </button>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
              {currentQuestion.question}
            </p>

            {/* Input Box for Answer */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typedAnswers[currentQuestion.id] || ''}
                  onChange={e => handleInputChange(e.target.value)}
                  placeholder="Ketik jawaban istilah gambar di sini..."
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-emerald-200 focus:border-emerald-600 focus:outline-hidden font-bold tracking-widest uppercase text-base sm:text-lg text-emerald-950 shadow-inner"
                />
                {quiz.settings.allowHints && (
                  <button
                    onClick={handleUseHint}
                    className="flex items-center gap-1.5 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition-colors shrink-0"
                    title="Buka 1 huruf petunjuk (-3 poin)"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-700" />
                    <span>Petunjuk</span>
                  </button>
                )}
              </div>

              {currentQuestion.hint && (
                <p className="text-xs text-slate-500 italic">
                  Clue: {currentQuestion.hint}
                </p>
              )}
            </div>

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
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={zoomImage}
            alt="Perbesaran Gambar"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

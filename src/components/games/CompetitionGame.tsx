import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CompetitionRoom, Quiz } from '../../types';
import { soundManager } from '../../services/audioEffects';
import { useApp } from '../../context/AppContext';
import { Trophy, Users, Play, Crown, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';

interface CompetitionGameProps {
  roomCode: string;
  quiz: Quiz;
  studentName: string;
  studentClass: string;
  onFinish: (resultId: string) => void;
  onBack: () => void;
}

export const CompetitionGame: React.FC<CompetitionGameProps> = ({
  roomCode,
  quiz,
  studentName,
  studentClass,
  onFinish,
  onBack
}) => {
  const { showToast, currentUser } = useApp();
  const [room, setRoom] = useState<CompetitionRoom | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Poll room status every 2 seconds
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/competition/rooms/${roomCode}`);
        if (res.ok) {
          const data: CompetitionRoom = await res.json();
          setRoom(data);
          if (data.status === 'STARTED' && !hasStarted) {
            setHasStarted(true);
            soundManager.playVictory();
            showToast('Pertandingan telah dimulai oleh guru!', 'success');
          }
        }
      } catch {
        // ignore polling error
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomCode, hasStarted]);

  // Join room on mount
  useEffect(() => {
    fetch(`/api/competition/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, studentClass })
    }).catch(() => {});
  }, [roomCode, studentName, studentClass]);

  // Teacher start room handler
  const handleTeacherStart = async () => {
    try {
      const res = await fetch(`/api/competition/rooms/${roomCode}/start`, { method: 'POST' });
      if (res.ok) {
        setHasStarted(true);
        soundManager.playVictory();
        showToast('Kompetisi resmi dimulai!', 'success');
      }
    } catch {
      showToast('Gagal memulai kompetisi.', 'error');
    }
  };

  const handleAnswer = (option: string) => {
    const q = quiz.questions[currentIndex];
    const isCorrect = option.toUpperCase() === q.answer.toUpperCase();
    let newScore = currentScore;

    if (isCorrect) {
      newScore += 100;
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    setCurrentScore(newScore);

    const nextIdx = currentIndex + 1;
    const finished = nextIdx >= quiz.questions.length;

    // Report score update to server
    fetch(`/api/competition/rooms/${roomCode}/update-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        score: newScore,
        questionIndex: nextIdx,
        completed: finished
      })
    }).catch(() => {});

    if (finished) {
      setIsCompleted(true);
      soundManager.playVictory();
      confetti({ particleCount: 150, spread: 80 });
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const sortedParticipants = room ? [...room.participants].sort((a, b) => b.score - a.score) : [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)]">
      {/* Top Bar */}
      <div className="bg-white border-b border-emerald-100 py-3 px-4 sm:px-6 shadow-xs sticky top-16 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              LIVE COMPETITION ROOM • {roomCode}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {quiz.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Skor Anda: {currentScore}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Active Game or Lobby */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          {!hasStarted ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto animate-bounce">
                <Crown className="w-10 h-10 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Ruang Tunggu Kompetisi
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Kode Room: <span className="font-mono font-bold text-emerald-700">{roomCode}</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Menunggu guru / host menekan tombol "Mulai Pertandingan"
                </p>
              </div>

              {currentUser.role === 'GURU' && (
                <button
                  onClick={handleTeacherStart}
                  className="px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/30 flex items-center gap-2 mx-auto active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Mulai Pertandingan Sekarang
                </button>
              )}
            </div>
          ) : isCompleted ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 fill-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Pertandingan Selesai!
                </h3>
                <p className="text-base font-bold text-emerald-800 mt-1">
                  Skor Akhir Anda: {currentScore} Poin
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Lihat papan peringkat langsung di sebelah kanan.
                </p>
              </div>
              <button
                onClick={onBack}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Soal Duel {currentIndex + 1} dari {quiz.questions.length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  +100 Poin per jawaban benar
                </span>
              </div>

              <p className="text-lg font-bold text-slate-900 leading-snug">
                {quiz.questions[currentIndex]?.question}
              </p>

              <div className="space-y-3">
                {quiz.questions[currentIndex]?.options.map((opt, idx) => (
                  <button
                    key={`opt_duel_${idx}`}
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all text-sm font-semibold text-slate-800 flex items-center gap-3 shadow-xs"
                  >
                    <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live Scoreboard */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Papan Peringkat Live
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {sortedParticipants.length} Peserta
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {sortedParticipants.map((p, idx) => {
              const isMe = p.name.toLowerCase() === studentName.toLowerCase();
              let rankBadge = `${idx + 1}`;
              let rankStyle = 'bg-slate-100 text-slate-700';

              if (idx === 0) {
                rankBadge = '🥇';
                rankStyle = 'bg-amber-100 text-amber-900 text-sm';
              } else if (idx === 1) {
                rankBadge = '🥈';
                rankStyle = 'bg-slate-200 text-slate-800 text-sm';
              } else if (idx === 2) {
                rankBadge = '🥉';
                rankStyle = 'bg-amber-200/60 text-amber-900 text-sm';
              }

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-emerald-50 border-emerald-400 font-bold'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${rankStyle}`}>
                      {rankBadge}
                    </span>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {p.name} {isMe && '(Anda)'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Kelas {p.studentClass} • {p.completed ? 'Selesai' : `Soal ${p.currentQuestionIndex + 1}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-black text-emerald-800 font-mono">
                    {p.score} pt
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

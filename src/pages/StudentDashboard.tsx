import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Quiz, QuizResult } from '../types';
import {
  GraduationCap,
  Award,
  Trophy,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Flame,
  Star,
  BookOpen
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, setActiveQuizCode, setCurrentPage } = useApp();

  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);
  const [myHistory, setMyHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    // Load quizzes
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveQuizzes(data.filter(q => q.status === 'ACTIVE'));
        }
      })
      .catch(() => {});

    // Load results
    fetch('/api/results')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter by student name or role
          setMyHistory(data.filter(r => r.studentName.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.role === 'SISWA'));
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const handlePlayQuiz = (code: string) => {
    setActiveQuizCode(code);
    setCurrentPage('join');
  };

  const totalPoints = myHistory.reduce((acc, r) => acc + r.score, 0);

  const badges = [
    { title: 'Cinta Ilmu', desc: 'Selesaikan kuis pertama', icon: '📖', earned: myHistory.length >= 1 },
    { title: 'Penjelajah Kata', desc: 'Selesaikan TTS Ekonomi Digital', icon: '🧩', earned: myHistory.some(r => r.quizTitle?.includes('TTS')) },
    { title: 'Kilat 10 Detik', desc: 'Raih skor kuis cepat', icon: '⚡', earned: myHistory.some(r => r.quizTitle?.includes('Cepat')) },
    { title: 'Bintang Matsamaga', desc: 'Nilai sempurna 100 poin', icon: '⭐', earned: myHistory.some(r => r.score >= 100) },
    { title: 'Sang Juara Kelas', desc: 'Ikuti kompetisi live room', icon: '🏆', earned: myHistory.some(r => r.quizTitle?.includes('Kompetisi')) }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Student Profile Hero Banner (High Density) */}
      <div className="bg-[#065F46] rounded-xl p-5 text-white shadow-xs border border-emerald-900/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-inner shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700/50">
                PESERTA DIDIK • MTSN 5 TEGAL
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold mt-1 text-white tracking-tight">
              {currentUser.name}
            </h1>
            <p className="text-xs text-emerald-100">
              Kelas {currentUser.studentClass || 'IX A'} • Pangkat: <b className="text-emerald-200">Cendekiawan Muda</b>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/40 text-center min-w-[90px]">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Total Skor</span>
            <span className="text-xl font-bold text-amber-300 font-mono">{totalPoints}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-900/50 border border-emerald-700/40 text-center min-w-[90px]">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">Kuis Tuntas</span>
            <span className="text-xl font-bold text-white font-mono">{myHistory.length}</span>
          </div>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            Lencana Prestasi Madrasah (Badges)
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {badges.filter(b => b.earned).length} / {badges.length} Terbuka
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-center transition-all ${
                badge.earned
                  ? 'bg-amber-50/50 border-amber-200 text-gray-900 shadow-2xs'
                  : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <div className="font-bold text-xs">{badge.title}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{badge.desc}</div>
              {badge.earned && (
                <span className="inline-block mt-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded">
                  TERBUKA
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Quizzes Available to Play */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            Kuis Edukatif Tersedia Untuk Kelas Anda
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {activeQuizzes.length} Kuis Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeQuizzes.map(quiz => (
            <div
              key={quiz.id}
              className="p-3.5 rounded-lg border border-gray-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {quiz.type}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {quiz.code}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 mt-2 group-hover:text-emerald-700 transition-colors">
                  {quiz.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {quiz.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-2.5">
                  <span>{quiz.questions.length} Butir Soal</span>
                  <span>•</span>
                  <span>{quiz.settings.durationMinutes} Menit</span>
                </div>
              </div>

              <button
                onClick={() => handlePlayQuiz(quiz.code)}
                className="w-full py-2 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Mulai Kerjakan Sekarang</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz History Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b border-gray-100 pb-2.5">
          <Clock className="w-4 h-4 text-emerald-700" />
          Riwayat Pengerjaan Kuis Anda
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Nama Kuis</th>
                <th className="py-2.5 px-3">Tanggal Pengerjaan</th>
                <th className="py-2.5 px-3">Nilai</th>
                <th className="py-2.5 px-3">Benar / Salah</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {myHistory.length > 0 ? (
                myHistory.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{h.quizTitle}</td>
                    <td className="py-2.5 px-3 text-gray-400">
                      {new Date(h.submittedAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800 font-mono text-sm">
                      {h.score}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      <span className="text-emerald-700 font-bold">{h.correctCount} B</span> /{' '}
                      <span className="text-rose-600 font-bold">{h.wrongCount} S</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          h.score >= (h.passingScore || 75)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {h.score >= (h.passingScore || 75) ? 'TUNTAS' : 'REMEDIAL'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Belum ada riwayat kuis yang diselesaikan. Silakan kerjakan kuis pertama Anda di atas!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

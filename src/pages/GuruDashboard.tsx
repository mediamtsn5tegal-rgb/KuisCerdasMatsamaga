import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Quiz } from '../types';
import { ShareModal } from '../components/ShareModal';
import { PrintCrosswordModal } from '../components/PrintCrosswordModal';
import {
  PlusCircle,
  Sparkles,
  BookOpen,
  Share2,
  Printer,
  BarChart3,
  Copy,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  Layers,
  Users,
  Search,
  Grid,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { GoogleSheetsSyncCard } from '../components/common/GoogleSheetsSyncCard';

export const GuruDashboard: React.FC = () => {
  const { setCurrentPage, setActiveQuizCode, setActiveAnalyticsQuizId, showToast, refreshKey, triggerRefresh } = useApp();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Modals
  const [sharingQuiz, setSharingQuiz] = useState<Quiz | null>(null);
  const [printingQuiz, setPrintingQuiz] = useState<Quiz | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);

  useEffect(() => {
    // Load Quizzes
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQuizzes(data);
      })
      .catch(() => {});

    // Load total questions
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTotalQuestions(data.length);
      })
      .catch(() => {});

    // Load results count
    fetch('/api/results')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTotalResults(data.length);
      })
      .catch(() => {});
  }, [refreshKey]);

  const handleDuplicate = async (quiz: Quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showToast(`Kuis "${quiz.title}" berhasil diduplikasi!`, 'success');
        triggerRefresh();
      }
    } catch {
      showToast('Gagal menduplikasi kuis.', 'error');
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kuis ini?')) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Kuis berhasil dihapus.', 'success');
        triggerRefresh();
      }
    } catch {
      showToast('Gagal menghapus kuis.', 'error');
    }
  };

  const handlePlayQuiz = (quiz: Quiz) => {
    setActiveQuizCode(quiz.code);
    setCurrentPage('join');
  };

  const handleOpenAnalytics = (quizId: string) => {
    setActiveAnalyticsQuizId(quizId);
    setCurrentPage('analytics');
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || q.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const activeCount = quizzes.filter(q => q.status === 'ACTIVE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* High Density Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Guru</h2>
          <p className="text-gray-500 text-sm">"Belajar, Bermain, Berpikir, dan Berprestasi." • MTsN 5 Tegal</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSheetsModal(true)}
            className="bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-4 py-2.5 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            title="Buka Sinkronisasi Google Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Spreadsheet</span>
          </button>

          <button
            onClick={() => setCurrentPage('quiz_builder')}
            className="bg-[#10B981] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-emerald-200/50 flex items-center gap-2 hover:bg-[#059669] transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ BUAT KUIS BARU</span>
          </button>

          <button
            onClick={() => setCurrentPage('question_bank')}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span>Bank Soal</span>
          </button>
        </div>
      </div>

      {/* 4 Key Statistics Cards (High Density) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Kuis Aktif</p>
          <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Dapat diakses peserta</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Total Peserta</p>
          <p className="text-3xl font-black text-gray-800">{totalResults}</p>
          <p className="text-[10px] text-gray-400 mt-1">Hasil pengerjaan tuntas</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Total Butir Soal</p>
          <p className="text-3xl font-black text-blue-600">{totalQuestions}</p>
          <p className="text-[10px] text-blue-500 font-semibold mt-1">Bank Soal MTsN 5</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">AI Credits</p>
          <p className="text-3xl font-black text-orange-500">∞</p>
          <p className="text-[10px] text-orange-400 mt-1 font-semibold">Unlimited for Staff</p>
        </div>
      </div>

      {/* High Density Split Layout: Table (2 cols) & Dark AI Generator Card (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Quizzes Table Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                📋 Kuis Terbaru & Aktif
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {filteredQuizzes.length} Kuis
              </span>
            </div>

            {/* Filter and Search Bar inside Header */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari kuis..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-600 focus:outline-hidden text-xs bg-gray-50 focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              </div>

              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="CROSSWORD">TTS</option>
                <option value="WORD_SEARCH">Word Search</option>
                <option value="MULTIPLE_CHOICE">PG</option>
                <option value="PICTURE_GUESS">Tebak Gambar</option>
                <option value="SPEED_QUIZ">Kuis Cepat</option>
                <option value="COMPETITION">Live Room</option>
              </select>
            </div>
          </div>

          {/* Table of Quizzes */}
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 sticky top-0 text-[11px] uppercase tracking-wider font-bold text-gray-400 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Kuis & Materi</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Partisipan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredQuizzes.length > 0 ? (
                  filteredQuizzes.map(quiz => (
                    <tr key={quiz.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800 text-sm">
                          {quiz.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                            {quiz.code}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase">
                            {quiz.subject} • Kelas {quiz.grade}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {quiz.type === 'CROSSWORD' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                            🧩 TTS
                          </span>
                        )}
                        {quiz.type === 'MULTIPLE_CHOICE' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                            ❓ PG
                          </span>
                        )}
                        {quiz.type === 'WORD_SEARCH' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">
                            🔎 Word Search
                          </span>
                        )}
                        {quiz.type === 'PICTURE_GUESS' && (
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-bold">
                            🖼️ Tebak Gambar
                          </span>
                        )}
                        {quiz.type === 'SPEED_QUIZ' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                            ⚡ Kuis Cepat
                          </span>
                        )}
                        {quiz.type === 'COMPETITION' && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                            🏆 Live Room
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {quiz.questions.length} Soal • {quiz.settings.durationMinutes}m
                      </td>
                      <td className="py-3 px-4">
                        {quiz.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Play button */}
                          <button
                            onClick={() => handlePlayQuiz(quiz)}
                            title="Buka / Mainkan Kuis"
                            className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-emerald-700" />
                          </button>

                          {/* Share QR */}
                          <button
                            onClick={() => setSharingQuiz(quiz)}
                            title="Bagikan Tautan & QR Code"
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Crossword if type is CROSSWORD */}
                          {quiz.type === 'CROSSWORD' && (
                            <button
                              onClick={() => setPrintingQuiz(quiz)}
                              title="Cetak Lembar Kerja TTS (Siswa / Guru)"
                              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Analytics */}
                          <button
                            onClick={() => handleOpenAnalytics(quiz.id)}
                            title="Lihat Analisis Butir Soal"
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(quiz)}
                            title="Duplikasi Kuis"
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(quiz.id)}
                            title="Hapus Kuis"
                            className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Tidak ada kuis yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: AI Quiz Generator Widget (High Density Theme Dark Card) */}
        <div className="bg-[#0F172A] rounded-xl shadow-xl p-5 flex flex-col gap-4 text-white relative overflow-hidden border border-gray-800">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none">
            <span className="text-8xl font-black">AI</span>
          </div>

          <div className="relative z-10">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              AI Quiz Generator
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Generate kuis berkualitas dalam hitungan detik menggunakan kecerdasan buatan.
            </p>
          </div>

          <div className="flex flex-col gap-3 relative z-10 mt-1">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                Mata Pelajaran & Fase
              </label>
              <select
                id="quick-ai-subject"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option>IPS - Fase D (Kelas IX)</option>
                <option>PAI & Budi Pekerti - Fase D</option>
                <option>Bahasa Indonesia - Fase D</option>
                <option>IPA Terpadu - Fase D</option>
                <option>Matematika - Fase D</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                Materi Utama
              </label>
              <input
                id="quick-ai-topic"
                type="text"
                placeholder="Contoh: Revolusi Industri & Ekonomi Digital"
                defaultValue="Perdagangan Bebas & Ekonomi Digital"
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                  Jumlah Soal
                </label>
                <input
                  id="quick-ai-count"
                  type="number"
                  defaultValue="10"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                  Game Mode
                </label>
                <select
                  id="quick-ai-mode"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="CROSSWORD">Teka-Teki Silang</option>
                  <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                  <option value="WORD_SEARCH">Word Search</option>
                  <option value="SPEED_QUIZ">Kuis Cepat</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('ai_generator')}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-lg text-xs tracking-wide transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-950/40 mt-2 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>✨ GENERATE DRAFT KUIS</span>
            </button>

            <p className="text-[9px] text-gray-400 text-center italic">
              Sistem menyusun butir soal, kunci jawaban, KBC, dan taksonomi Bloom otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Share Modal Trigger */}
      {sharingQuiz && (
        <ShareModal quiz={sharingQuiz} onClose={() => setSharingQuiz(null)} />
      )}

      {/* Print Crossword Modal Trigger */}
      {printingQuiz && (
        <PrintCrosswordModal quiz={printingQuiz} onClose={() => setPrintingQuiz(null)} />
      )}

      {/* Google Sheets Sync Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Integrasi & Rekap Google Spreadsheet Madrasah
              </h3>
              <button
                onClick={() => setShowSheetsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <GoogleSheetsSyncCard onSuccess={() => triggerRefresh()} />
          </div>
        </div>
      )}
    </div>
  );
};

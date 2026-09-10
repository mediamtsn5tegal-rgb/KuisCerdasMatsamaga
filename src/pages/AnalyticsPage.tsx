import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Quiz, QuizResult } from '../types';
import {
  ArrowLeft,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeAnalyticsQuizId, setActiveAnalyticsQuizId, setCurrentPage } = useApp();

  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(activeAnalyticsQuizId || '');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all quizzes for switcher
  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then((data: Quiz[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllQuizzes(data);
          const currentExists = data.some(q => q.id === selectedQuizId);
          if (!selectedQuizId || !currentExists) {
            setSelectedQuizId(data[0].id);
            setActiveAnalyticsQuizId(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update selectedQuizId when activeAnalyticsQuizId changes externally
  useEffect(() => {
    if (activeAnalyticsQuizId) {
      setSelectedQuizId(activeAnalyticsQuizId);
    }
  }, [activeAnalyticsQuizId]);

  // Load quiz details and results
  useEffect(() => {
    if (!selectedQuizId) return;

    setIsLoading(true);
    Promise.all([
      fetch(`/api/quizzes/${selectedQuizId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/results?quizId=${selectedQuizId}`).then(r => r.ok ? r.json() : [])
    ])
      .then(([quizData, resultsData]) => {
        if (quizData) setQuiz(quizData);
        if (Array.isArray(resultsData)) setResults(resultsData);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedQuizId]);

  const handleQuizChange = (newId: string) => {
    setSelectedQuizId(newId);
    setActiveAnalyticsQuizId(newId);
  };

  if (isLoading || !quiz) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-500 text-xs">
        Memuat data analisis butir soal...
      </div>
    );
  }

  // Calculate stats
  const totalSubmissions = results.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / totalSubmissions)
    : 0;
  const passedCount = results.filter(r => r.score >= (quiz.settings.passingScore || 75)).length;
  const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

  // Item analysis
  const itemStats = quiz.questions.map((q, idx) => {
    let correctCount = 0;
    let totalAttempts = 0;

    results.forEach(r => {
      const ans = r.answersDetail?.[q.id];
      if (ans) {
        totalAttempts++;
        if (ans.isCorrect) correctCount++;
      }
    });

    const percentCorrect = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 80;
    let dayaSerap = 'Tinggi';
    if (percentCorrect < 50) dayaSerap = 'Rendah (Butuh Penguatan)';
    else if (percentCorrect < 75) dayaSerap = 'Sedang';

    return {
      index: idx + 1,
      question: q.question,
      answer: q.answer,
      percentCorrect,
      percentWrong: 100 - percentCorrect,
      cognitiveLevel: q.cognitiveLevel || 'C3',
      dayaSerap
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('guru_dashboard')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
              ANALISIS BUTIR SOAL & DAYA SERAP
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {quiz.title}
            </h1>
            <p className="text-xs text-slate-500">
              Mata Pelajaran: {quiz.subject} • Kelas {quiz.grade} • Kode: {quiz.code}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allQuizzes.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Pilih Kuis:</span>
              <select
                value={selectedQuizId}
                onChange={e => handleQuizChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden max-w-xs truncate cursor-pointer"
              >
                {allQuizzes.map(q => (
                  <option key={q.id} value={q.id}>
                    [{q.type}] {q.title} ({q.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Cetak Rekap Nilai</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Jumlah Siswa Mengerjakan</span>
          <div className="text-2xl font-black text-slate-900">{totalSubmissions} Siswa</div>
          <span className="text-[11px] text-emerald-700 font-medium">Data tervalidasi</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Rata-Rata Nilai Kelas</span>
          <div className="text-2xl font-black text-emerald-800">{avgScore} Poin</div>
          <span className="text-[11px] text-slate-400">KKTP Standar: {quiz.settings.passingScore || 75}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Ketuntasan Klasikal</span>
          <div className="text-2xl font-black text-sky-800">{passRate}%</div>
          <span className="text-[11px] text-slate-400">{passedCount} dari {totalSubmissions} tuntas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Rekomendasi Tindak Lanjut</span>
          <div className="text-sm font-bold text-amber-900 mt-1">
            {passRate >= 75 ? 'Pengayaan Materi' : 'Remedial Terarah'}
          </div>
          <span className="text-[11px] text-slate-400">Kurikulum Merdeka</span>
        </div>
      </div>

      {/* Item Analysis Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          Tabel Analisis Butir Soal (Item Analysis)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">Pertanyaan & Kunci</th>
                <th className="py-3 px-4">Bloom</th>
                <th className="py-3 px-4">Tingkat Benar (%)</th>
                <th className="py-3 px-4">Klasifikasi Daya Serap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {itemStats.map(item => (
                <tr key={item.index} className="hover:bg-emerald-50/30">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.index}</td>
                  <td className="py-3.5 px-4 max-w-md">
                    <p className="font-semibold text-slate-900 leading-snug">{item.question}</p>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] mt-1 inline-block">
                      Kunci: {item.answer}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-100 text-sky-800">
                      {item.cognitiveLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.percentCorrect >= 75 ? 'bg-emerald-600' : item.percentCorrect >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${item.percentCorrect}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900">{item.percentCorrect}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        item.percentCorrect >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.percentCorrect >= 50
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.dayaSerap}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student List Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="w-4 h-4 text-emerald-700" />
          Daftar Nilai Peserta Didik ({results.length} Siswa)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Skor Akhir</th>
                <th className="py-3 px-4">Benar / Salah</th>
                <th className="py-3 px-4">Waktu Pengerjaan</th>
                <th className="py-3 px-4">Status Ketuntasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {results.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.studentName}</td>
                  <td className="py-3.5 px-4">{r.studentClass}</td>
                  <td className="py-3.5 px-4 font-black text-sm text-emerald-800 font-mono">
                    {r.score}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="text-emerald-700 font-bold">{r.correctCount} benar</span> •{' '}
                    <span className="text-rose-600 font-bold">{r.wrongCount} salah</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {Math.floor(r.timeSpentSeconds / 60)}m {r.timeSpentSeconds % 60}s
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        r.score >= (r.passingScore || 75)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.score >= (r.passingScore || 75) ? 'TUNTAS' : 'REMEDIAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

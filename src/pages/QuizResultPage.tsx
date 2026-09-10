import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QuizResult, Quiz } from '../types';
import { useApp } from '../context/AppContext';
import { soundManager } from '../services/audioEffects';
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Home,
  Printer,
  Sparkles,
  Heart,
  ArrowRight,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { getAccessToken } from '../services/googleAuthService';
import { appendQuizResultToSheets } from '../services/googleSheetsService';

interface QuizResultPageProps {
  resultId: string;
  onPlayAgain: () => void;
}

export const QuizResultPage: React.FC<QuizResultPageProps> = ({ resultId, onPlayAgain }) => {
  const { setCurrentPage, triggerRefresh } = useApp();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [sheetSynced, setSheetSynced] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string>('');

  useEffect(() => {
    fetch(`/api/results/${resultId}`)
      .then(res => res.json())
      .then(async data => {
        setResult(data);
        let fetchedQuiz: Quiz | null = null;
        if (data.quizId) {
          try {
            const qRes = await fetch(`/api/quizzes/${data.quizId}`);
            if (qRes.ok) {
              fetchedQuiz = await qRes.json();
              setQuiz(fetchedQuiz);
            }
          } catch {}
        }

        // Check if Google Spreadsheet is configured and sync automatically
        try {
          const settingsRes = await fetch('/api/admin/settings');
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            if (settings?.googleSpreadsheetId) {
              setSheetUrl(
                settings.googleSpreadsheetUrl ||
                  `https://docs.google.com/spreadsheets/d/${settings.googleSpreadsheetId}/edit`
              );
              const token = await getAccessToken();
              if (token) {
                await appendQuizResultToSheets(
                  token,
                  settings.googleSpreadsheetId,
                  data,
                  fetchedQuiz?.questions
                );
                setSheetSynced(true);
              }
            }
          }
        } catch (err) {
          console.error('Auto sync sheets error:', err);
        }
      })
      .catch(() => {});
  }, [resultId]);

  useEffect(() => {
    if (result && result.score >= 75) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [result]);

  if (!result) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-slate-500 text-sm">
        Memuat data hasil evaluasi...
      </div>
    );
  }

  const isPassed = result.score >= (result.passingScore || 75);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Celebration Header Card */}
      <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            HASIL ASESMEN EDUKATIF • {result.studentClass}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Selamat, {result.studentName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {result.quizTitle}
          </p>
        </div>

        {/* Big Score Display */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 inline-block min-w-[240px]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            SKOR AKHIR
          </div>
          <div className="text-5xl sm:text-6xl font-black text-emerald-800 tracking-tight my-1">
            {result.score}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
            {isPassed ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Tuntas KKTP (≥{result.passingScore || 75})
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Butuh Remedial (&lt;{result.passingScore || 75})
              </span>
            )}
          </div>
        </div>

        {/* 3 Metric Breakdown Pills */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Jawaban Benar</span>
            <span className="text-lg font-black text-emerald-950">{result.correctCount} Soal</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
            <span className="text-[10px] text-rose-800 font-bold uppercase block">Jawaban Salah</span>
            <span className="text-lg font-black text-rose-950">{result.wrongCount} Soal</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
            <span className="text-[10px] text-sky-800 font-bold uppercase block">Waktu Selesai</span>
            <span className="text-lg font-black text-sky-950 font-mono">
              {Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s
            </span>
          </div>
        </div>

        {/* Badges Earned */}
        {result.badgesEarned && result.badgesEarned.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <span className="font-extrabold flex items-center justify-center gap-1.5 text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Lencana Prestasi Baru Terbuka!
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {result.badgesEarned.map((b, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px] shadow-2xs"
                >
                  🏅 {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Google Spreadsheet Sync Badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">
                {sheetSynced
                  ? 'Tersimpan Otomatis di Google Spreadsheet MTsN 5 Tegal'
                  : 'Hasil Asesmen Tersimpan Aman di Database Madrasah'}
              </p>
              <p className="text-[11px] text-slate-500">
                Data nilai, persentase kelulusan KKTP, dan detail respon pengerjaan tersimpan di server.
              </p>
            </div>
          </div>

          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shrink-0 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Rekap Nilai</span>
            </a>
          )}
        </div>

        {/* Islamic & Educational Motivation Quote */}
        <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-100 text-xs text-center italic space-y-1">
          <p>"Man jadda wajada — Siapa yang bersungguh-sungguh, ia akan berhasil."</p>
          <p className="text-[11px] text-emerald-400 font-semibold not-italic">
            Karakter Madrasah: Kejujuran & Semangat Cinta Ilmu
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Cetak Bukti Nilai</span>
          </button>

          <button
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
};

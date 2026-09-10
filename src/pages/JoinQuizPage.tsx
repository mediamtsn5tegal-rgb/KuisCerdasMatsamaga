import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Quiz } from '../types';
import { KeyRound, User, Users, Play, AlertCircle, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface JoinQuizPageProps {
  onStartGame: (quiz: Quiz, studentName: string, studentClass: string) => void;
}

export const JoinQuizPage: React.FC<JoinQuizPageProps> = ({ onStartGame }) => {
  const { activeQuizCode, setActiveQuizCode, showToast, currentUser, setCurrentPage } = useApp();

  const [code, setCode] = useState(activeQuizCode || 'KCM-9A7X2');
  const [name, setName] = useState(currentUser.role === 'SISWA' ? currentUser.name : '');
  const [studentClass, setStudentClass] = useState('IX A');
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [verifiedQuiz, setVerifiedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load classes
  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
      })
      .catch(() => {});
  }, []);

  // Check quiz code whenever code changes
  useEffect(() => {
    if (!code || code.trim().length < 4) {
      setVerifiedQuiz(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/quizzes/${code.trim()}`);
        if (res.ok) {
          const quizData: Quiz = await res.json();
          setVerifiedQuiz(quizData);
        } else {
          setVerifiedQuiz(null);
          setErrorMsg('Kuis dengan kode ini tidak ditemukan atau belum aktif.');
        }
      } catch {
        setVerifiedQuiz(null);
        setErrorMsg('Gagal memeriksa kode kuis.');
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [code]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Mohon masukkan nama peserta didik.', 'error');
      return;
    }
    if (!verifiedQuiz) {
      showToast('Kode kuis belum valid atau tidak ditemukan.', 'error');
      return;
    }

    onStartGame(verifiedQuiz, name.trim(), studentClass);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Gabung Kuis Edukatif
              </h2>
              <p className="text-xs text-slate-500">
                MTsN 5 Tegal • Masukkan identitas peserta
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('landing')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          {/* Quiz Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              KODE KUIS
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setCode(val);
                  setActiveQuizCode(val);
                }}
                placeholder="Misal: KCM-9A7X2"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:outline-hidden font-mono font-bold text-lg tracking-widest uppercase text-emerald-950"
              />
              {isLoading && (
                <div className="absolute right-4 top-3.5 text-xs text-slate-400 animate-pulse">
                  Memeriksa...
                </div>
              )}
            </div>
          </div>

          {/* Verified Quiz Preview Box */}
          {verifiedQuiz && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Kuis Ditemukan!
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                  {verifiedQuiz.type}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{verifiedQuiz.title}</h4>
              <div className="text-[11px] text-slate-600 flex items-center gap-3 pt-1">
                <span>Mapel: <b>{verifiedQuiz.subject}</b></span>
                <span>Jumlah Soal: <b>{verifiedQuiz.questions.length}</b></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <b>{verifiedQuiz.settings.durationMinutes} menit</b>
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              NAMA PESERTA DIDIK
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama lengkap atau nama panggilan"
                className="w-full px-4 py-3 pl-11 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:outline-hidden font-medium text-sm text-slate-900"
              />
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Class Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              KELAS
            </label>
            <div className="relative">
              <select
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                className="w-full px-4 py-3 pl-11 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:outline-hidden font-bold text-sm text-slate-900 bg-white"
              >
                {classes.length > 0 ? (
                  classes.map(c => (
                    <option key={c.id} value={c.name}>
                      Kelas {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="VII A">Kelas VII A</option>
                    <option value="VII B">Kelas VII B</option>
                    <option value="VIII A">Kelas VIII A</option>
                    <option value="VIII B">Kelas VIII B</option>
                    <option value="IX A">Kelas IX A</option>
                    <option value="IX B">Kelas IX B</option>
                  </>
                )}
              </select>
              <Users className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!verifiedQuiz || !name.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Mulai Kerjakan Kuis Sekarang</span>
            </button>
          </div>
        </form>

        {/* Demo Quick Codes */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Pilihan Kuis Demo Tersedia:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setCode('KCM-9A7X2');
                setName(name || 'Muhammad Raihan');
              }}
              className="p-2 text-left rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
            >
              <span className="font-bold block text-slate-900">TTS Ekonomi Digital</span>
              <span className="text-[10px] font-mono text-emerald-700">KCM-9A7X2</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('KCM-8W5R1');
                setName(name || 'Siti Fatimah');
              }}
              className="p-2 text-left rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
            >
              <span className="font-bold block text-slate-900">Word Search</span>
              <span className="text-[10px] font-mono text-emerald-700">KCM-8W5R1</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('KCM-7P4G9');
                setName(name || 'Muhammad Raihan');
              }}
              className="p-2 text-left rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
            >
              <span className="font-bold block text-slate-900">Pilihan Ganda IPS</span>
              <span className="text-[10px] font-mono text-emerald-700">KCM-7P4G9</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCode('KCM-ROOM-9A');
                setName(name || 'Ahmad Rifqi');
              }}
              className="p-2 text-left rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors"
            >
              <span className="font-bold block text-slate-900">Kompetisi Live Room</span>
              <span className="text-[10px] font-mono text-emerald-700">KCM-ROOM-9A</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

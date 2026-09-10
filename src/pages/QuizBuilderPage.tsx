import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Question, QuizType, Quiz } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Grid,
  Search,
  CheckSquare,
  Image as ImageIcon,
  Zap,
  Trophy,
  Plus,
  Trash2,
  Sliders,
  Calendar,
  Layers
} from 'lucide-react';

export const QuizBuilderPage: React.FC = () => {
  const { showToast, triggerRefresh, setCurrentPage } = useApp();

  const [step, setStep] = useState(1);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);

  // Step 1: Identity
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('IPS');
  const [grade, setGrade] = useState<'VII' | 'VIII' | 'IX'>('IX');
  const [topic, setTopic] = useState('Perkembangan Ekonomi di Era Digital');
  const [quizType, setQuizType] = useState<QuizType>('CROSSWORD');

  // Step 2: Questions selected
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // Step 3: Settings
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowHints, setAllowHints] = useState(true);
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  const [passingScore, setPassingScore] = useState(75);

  // Step 4: Targets
  const [targetClasses, setTargetClasses] = useState<string[]>(['IX A', 'IX B']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBankQuestions(data);
          // Pre-select some matching questions
          const matches = data.filter(q => q.subject === 'IPS').slice(0, 5);
          setSelectedQuestions(matches);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleQuestion = (q: Question) => {
    if (selectedQuestions.some(sq => sq.id === q.id)) {
      setSelectedQuestions(prev => prev.filter(sq => sq.id !== q.id));
    } else {
      setSelectedQuestions(prev => [...prev, q]);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('Judul kuis wajib diisi.', 'error');
      setStep(1);
      return;
    }
    if (selectedQuestions.length === 0) {
      showToast('Pilih minimal 1 butir soal untuk kuis.', 'error');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Quiz> = {
        title: title.trim(),
        description: description.trim() || `Kuis ${quizType} materi ${topic}`,
        subject,
        grade,
        topic,
        type: quizType,
        questions: selectedQuestions,
        targetClasses,
        status: 'ACTIVE',
        settings: {
          durationMinutes,
          shuffleQuestions,
          shuffleOptions,
          allowHints,
          immediateFeedback,
          showScoreAtEnd: true,
          passingScore
        }
      };

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data && data.code) {
        showToast(`Kuis "${data.title}" berhasil dipublikasikan! Kode: ${data.code}`, 'success');
        triggerRefresh();
        setCurrentPage('guru_dashboard');
      }
    } catch {
      showToast('Gagal mempublikasikan kuis.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quizTypes: { id: QuizType; title: string; icon: any; desc: string }[] = [
    { id: 'CROSSWORD', title: 'Teka-Teki Silang (TTS)', icon: Grid, desc: 'Petunjuk mendatar & menurun' },
    { id: 'WORD_SEARCH', title: 'Word Search', icon: Search, desc: 'Pencarian kata dalam matriks huruf' },
    { id: 'MULTIPLE_CHOICE', title: 'Pilihan Ganda', icon: CheckSquare, desc: 'Asesmen 4 opsi A/B/C/D' },
    { id: 'PICTURE_GUESS', title: 'Tebak Gambar', icon: ImageIcon, desc: 'Tebak istilah berdasarkan gambar visual' },
    { id: 'SPEED_QUIZ', title: 'Kuis Cepat', icon: Zap, desc: 'Hitung mundur 10 detik per soal' },
    { id: 'COMPETITION', title: 'Kompetisi Live', icon: Trophy, desc: 'Duel real-time dengan room PIN' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('guru_dashboard')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Quiz Builder MTsN 5 Tegal
            </h1>
            <p className="text-xs text-slate-500">
              Perancang kuis interaktif Kurikulum Merdeka (Fase D).
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${step === 1 ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>1</span>
          <span>→</span>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${step === 2 ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>2</span>
          <span>→</span>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${step === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>3</span>
          <span>→</span>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${step === 4 ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>4</span>
        </div>
      </div>

      {/* Step 1: Identity & Mode */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Langkah 1: Identitas & Jenis Permainan
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Judul Kuis
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Misal: Teka-Teki Silang Ekonomi Digital Fase D"
                className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-emerald-600 focus:outline-hidden font-bold text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="IPS">IPS (Ilmu Pengetahuan Sosial)</option>
                  <option value="PAI">PAI & Budi Pekerti</option>
                  <option value="MAT">Matematika</option>
                  <option value="IPA">IPA</option>
                  <option value="BIN">Bahasa Indonesia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="VII">Kelas VII (Fase D)</option>
                  <option value="VIII">Kelas VIII (Fase D)</option>
                  <option value="IX">Kelas IX (Fase D)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Materi Pokok</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Topik materi pelajaran"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Pilih Jenis Game:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {quizTypes.map(t => {
                  const Icon = t.icon;
                  const isSelected = quizType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQuizType(t.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-slate-900">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!title.trim()) {
                  setTitle(`Kuis ${quizType}: ${topic}`);
                }
                setStep(2);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
            >
              <span>Lanjut ke Pilih Soal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Questions Selection */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Langkah 2: Pilih Soal dari Bank Soal
              </h2>
              <p className="text-xs text-slate-500">
                Terpilih: <b>{selectedQuestions.length} Butir Soal</b>
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
            {bankQuestions.map(q => {
              const isSelected = selectedQuestions.some(sq => sq.id === q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleQuestion(q)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 ${isSelected ? 'bg-emerald-700 text-white' : 'border border-slate-300'}`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-900 leading-snug">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        Kunci: {q.answer}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Bloom: {q.cognitiveLevel}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {q.subject} • Kls {q.grade}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedQuestions.length === 0}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs"
            >
              <span>Lanjut ke Pengaturan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Langkah 3: Pengaturan Gameplay & Asesmen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-700">Durasi Pengerjaan (Menit)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              />
              <p className="text-[11px] text-slate-400">Kuis akan otomatis dikirim saat waktu habis.</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-700">Kriteria Ketercapaian (KKTP/KKM)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              />
              <p className="text-[11px] text-slate-400">Standar ketuntasan minimal di MTsN 5 Tegal.</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Acak Urutan Soal</span>
                <span className="text-[11px] text-slate-400">Tampilan berbeda untuk setiap siswa</span>
              </div>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={e => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 accent-emerald-700"
              />
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Izinkan Petunjuk (Hint)</span>
                <span className="text-[11px] text-slate-400">Pengurangan poin jika digunakan</span>
              </div>
              <input
                type="checkbox"
                checked={allowHints}
                onChange={e => setAllowHints(e.target.checked)}
                className="w-4 h-4 accent-emerald-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
            >
              <span>Lanjut ke Sasaran Kelas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Targets & Final Publish */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Langkah 4: Konfirmasi & Publikasi Kuis
          </h2>

          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <h4 className="font-extrabold text-sm text-emerald-900">{title}</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Jenis Game: <b>{quizType}</b></div>
              <div>Mapel & Jenjang: <b>{subject} Kelas {grade}</b></div>
              <div>Jumlah Soal: <b>{selectedQuestions.length} Butir</b></div>
              <div>Durasi: <b>{durationMinutes} Menit</b></div>
              <div>KKTP: <b>{passingScore} Poin</b></div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-700">Sasaran Rombel / Kelas:</label>
            <div className="flex flex-wrap gap-2">
              {['VII A', 'VII B', 'VIII A', 'VIII B', 'IX A', 'IX B'].map(cls => {
                const isTarget = targetClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      if (isTarget) setTargetClasses(prev => prev.filter(c => c !== cls));
                      else setTargetClasses(prev => [...prev, cls]);
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors ${
                      isTarget
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    Kelas {cls}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menerbitkan...' : 'Publikasikan Kuis Sekarang'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

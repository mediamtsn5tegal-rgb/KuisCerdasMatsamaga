import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Question, CognitiveLevel, KbcValue, ProfilLulusan, QuizType } from '../types';
import { getSafeErrorMessage } from '../utils/apiHelper';
import {
  Sparkles,
  Layers,
  FileText,
  RefreshCw,
  CheckCircle,
  Save,
  Trash2,
  Edit2,
  ArrowLeft,
  Grid,
  Search,
  CheckSquare,
  Zap,
  HelpCircle,
  Award,
  Heart
} from 'lucide-react';

export const AiGeneratorPage: React.FC = () => {
  const { showToast, triggerRefresh, setCurrentPage } = useApp();

  const [activeTab, setActiveTab] = useState<'STANDARD' | 'MATERIAL' | 'REMEDIAL'>('STANDARD');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [subject, setSubject] = useState('IPS');
  const [grade, setGrade] = useState<'VII' | 'VIII' | 'IX'>('IX');
  const [topic, setTopic] = useState('Perkembangan Ekonomi di Era Digital');
  const [subtopic, setSubtopic] = useState('Sistem Pembayaran dan Perdagangan Daring');
  const [learningObjective, setLearningObjective] = useState('Menganalisis peran transaksi digital, dompet digital, dan marketplace dalam perekonomian nasional');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>('C3');
  const [kbcValue, setKbcValue] = useState<KbcValue>('Cinta Ilmu');
  const [profilLulusan, setProfilLulusan] = useState<ProfilLulusan>('Penalaran kritis');
  const [targetQuizType, setTargetQuizType] = useState<QuizType>('CROSSWORD');
  const [materialText, setMaterialText] = useState('');

  // Generated results
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        subject,
        grade,
        topic,
        subtopic,
        learningObjective,
        count: Number(count),
        difficulty,
        cognitiveLevel,
        kbcValue,
        profilLulusan
      };

      if (activeTab === 'MATERIAL') {
        payload.materialText = materialText;
      } else if (activeTab === 'REMEDIAL') {
        payload.isRemedial = true;
      }

      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errMsg = await getSafeErrorMessage(res, 'Gagal membuat soal dengan AI');
        throw new Error(errMsg);
      }

      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        showToast(`Berhasil membuat ${data.questions.length} butir soal dengan AI! Silakan tinjau sebelum disimpan.`, 'success');
      } else {
        throw new Error(data.error || 'Gagal membuat soal');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveToBank = async () => {
    if (generatedQuestions.length === 0) return;
    try {
      for (const q of generatedQuestions) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...q, status: 'APPROVED' })
        });
      }
      showToast(`Berhasil menyimpan ${generatedQuestions.length} butir soal ke Bank Soal!`, 'success');
      triggerRefresh();
      setCurrentPage('question_bank');
    } catch {
      showToast('Gagal menyimpan soal ke bank soal.', 'error');
    }
  };

  const handleDirectPublishQuiz = async () => {
    if (generatedQuestions.length === 0) return;
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${targetQuizType === 'CROSSWORD' ? 'TTS' : targetQuizType === 'WORD_SEARCH' ? 'Word Search' : 'Kuis'}: ${topic}`,
          description: `Kuis asesmen formatif materi ${topic} (${subject} Kelas ${grade}). Dibuat dengan bantuan AI Quiz Generator MTsN 5 Tegal.`,
          subject,
          grade,
          topic,
          type: targetQuizType,
          questions: generatedQuestions,
          status: 'ACTIVE'
        })
      });

      if (!res.ok) {
        const errMsg = await getSafeErrorMessage(res, 'Gagal mempublikasikan kuis');
        throw new Error(errMsg);
      }

      const data = await res.json().catch(() => ({}));
      if (data && data.code) {
        showToast(`Kuis "${data.title}" berhasil dipublikasikan! Kode: ${data.code}`, 'success');
        triggerRefresh();
        setCurrentPage('guru_dashboard');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal mempublikasikan kuis.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('guru_dashboard')}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              AI Quiz Generator & Kurikulum Terintegrasi
            </h1>
            <p className="text-xs text-gray-500">
              Ciptakan butir soal cerdas berkarakter madrasah, Kurikulum Berbasis Cinta (KBC), dan Taksonomi Bloom.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('STANDARD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'STANDARD'
              ? 'bg-[#065F46] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Generator Soal Tematik
        </button>

        <button
          onClick={() => setActiveTab('MATERIAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'MATERIAL'
              ? 'bg-[#065F46] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Materi → Kuis (Ekstraksi Teks)
        </button>

        <button
          onClick={() => setActiveTab('REMEDIAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'REMEDIAL'
              ? 'bg-[#065F46] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Generator Remedial & Pengayaan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3.5 text-xs">
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            Parameter Pembelajaran
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="IPS">IPS</option>
                <option value="PAI">PAI & Budi Pekerti</option>
                <option value="MAT">Matematika</option>
                <option value="IPA">IPA</option>
                <option value="BIN">Bahasa Indonesia</option>
                <option value="BIG">Bahasa Inggris</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenjang / Kelas</label>
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
              placeholder="Misal: Perkembangan Ekonomi di Era Digital"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Submateri / Topik Khusus</label>
            <input
              type="text"
              value={subtopic}
              onChange={e => setSubtopic(e.target.value)}
              placeholder="Misal: Perdagangan Daring & Sistem Pembayaran"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          {activeTab === 'MATERIAL' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tempelkan Teks Ringkasan Materi Pelajaran
              </label>
              <textarea
                value={materialText}
                onChange={e => setMaterialText(e.target.value)}
                rows={5}
                placeholder="Tempelkan paragraf materi ajar atau modul madrasah di sini..."
                className="w-full p-2.5 rounded-xl border border-slate-200 leading-relaxed font-sans"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah Soal</label>
              <select
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
              >
                <option value={3}>3 Soal</option>
                <option value={5}>5 Soal</option>
                <option value={8}>8 Soal</option>
                <option value={10}>10 Soal</option>
                <option value={15}>15 Soal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tingkat Kesulitan</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Level Kognitif Bloom</label>
              <select
                value={cognitiveLevel}
                onChange={e => setCognitiveLevel(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="C1">C1 - Mengingat</option>
                <option value="C2">C2 - Memahami</option>
                <option value="C3">C3 - Menerapkan</option>
                <option value="C4">C4 - Menganalisis</option>
                <option value="C5">C5 - Mengevaluasi</option>
                <option value="C6">C6 - Mencipta</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nilai KBC</label>
              <select
                value={kbcValue}
                onChange={e => setKbcValue(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-emerald-800 font-semibold"
              >
                <option value="Cinta Ilmu">Cinta Ilmu</option>
                <option value="Cinta Allah SWT dan Rasulullah">Cinta Allah SWT & Rasul</option>
                <option value="Cinta Diri dan Sesama">Cinta Diri & Sesama</option>
                <option value="Cinta Lingkungan">Cinta Lingkungan</option>
                <option value="Cinta Tanah Air">Cinta Tanah Air</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ubah Menjadi Kuis Edukatif:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetQuizType('CROSSWORD')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  targetQuizType === 'CROSSWORD'
                    ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Grid className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Teka-Teki Silang</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetQuizType('WORD_SEARCH')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  targetQuizType === 'WORD_SEARCH'
                    ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Search className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Word Search</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetQuizType('MULTIPLE_CHOICE')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  targetQuizType === 'MULTIPLE_CHOICE'
                    ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Pilihan Ganda</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetQuizType('SPEED_QUIZ')}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  targetQuizType === 'SPEED_QUIZ'
                    ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Zap className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Kuis Cepat</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-md shadow-emerald-200/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Merancang Soal Edukatif...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>GENERATE BUTIR SOAL DENGAN AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Output & Draft Review */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                Hasil Perancangan Soal ({generatedQuestions.length} Butir)
              </h3>
              <p className="text-[11px] text-gray-400">
                Status: <b>DRAFT</b> (Dapat ditinjau dan diedit oleh guru sebelum disahkan)
              </p>
            </div>

            {generatedQuestions.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToBank}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simpan ke Bank</span>
                </button>

                <button
                  onClick={handleDirectPublishQuiz}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Publikasikan Kuis</span>
                </button>
              </div>
            )}
          </div>

          {generatedQuestions.length > 0 ? (
            <div className="space-y-4">
              {generatedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm leading-snug">
                        {q.question}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                          Jawaban: {q.answer}
                        </span>
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                          Bloom: {q.cognitiveLevel}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {q.kbcValue?.[0]}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Hapus butir soal ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {q.hint && (
                    <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      💡 <b>Petunjuk:</b> {q.hint}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      📖 <b>Pembahasan:</b> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Belum ada butir soal yang di-generate
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tentukan mata pelajaran, materi pokok, dan level kognitif di panel sebelah kiri lalu tekan tombol <b>Generate Butir Soal dengan AI</b>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

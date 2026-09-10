import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Question, CognitiveLevel, KbcValue, ProfilLulusan } from '../types';
import {
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  X,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const { showToast, refreshKey, triggerRefresh, setCurrentPage } = useApp();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedCogLevel, setSelectedCogLevel] = useState('ALL');
  const [selectedDiff, setSelectedDiff] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // New Question Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formExplanation, setFormExplanation] = useState('');
  const [formHint, setFormHint] = useState('');
  const [formSubject, setFormSubject] = useState('IPS');
  const [formGrade, setFormGrade] = useState<'VII' | 'VIII' | 'IX'>('IX');
  const [formTopic, setFormTopic] = useState('Perkembangan Ekonomi di Era Digital');
  const [formCogLevel, setFormCogLevel] = useState<CognitiveLevel>('C3');
  const [formDiff, setFormDiff] = useState<'Mudah' | 'Sedang' | 'Sulit'>('Sedang');
  const [formKbc, setFormKbc] = useState<KbcValue>('Cinta Ilmu');
  const [formProfil, setFormProfil] = useState<ProfilLulusan>('Penalaran kritis');

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  useEffect(() => {
    let url = `/api/questions?search=${encodeURIComponent(search)}`;
    if (selectedSubject !== 'ALL') url += `&subject=${selectedSubject}`;
    if (selectedGrade !== 'ALL') url += `&grade=${selectedGrade}`;
    if (selectedCogLevel !== 'ALL') url += `&cognitiveLevel=${selectedCogLevel}`;
    if (selectedDiff !== 'ALL') url += `&difficulty=${selectedDiff}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQuestions(data);
      })
      .catch(() => {});
  }, [search, selectedSubject, selectedGrade, selectedCogLevel, selectedDiff, refreshKey]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      showToast('Pertanyaan dan jawaban wajib diisi.', 'error');
      return;
    }

    const payload = {
      question: formQuestion.trim(),
      answer: formAnswer.trim().toUpperCase(),
      options: formOptions.map((o, idx) => (o.trim() ? o.trim() : idx === 0 ? formAnswer.trim() : `Pilihan ${idx + 1}`)),
      explanation: formExplanation.trim(),
      hint: formHint.trim(),
      subject: formSubject,
      grade: formGrade,
      topic: formTopic,
      cognitiveLevel: formCogLevel,
      difficulty: formDiff,
      kbcValue: [formKbc],
      profilLulusan: [formProfil]
    };

    try {
      if (editingQuestion) {
        const res = await fetch(`/api/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Butir soal berhasil diperbarui.', 'success');
          setIsCreateModalOpen(false);
          setEditingQuestion(null);
          triggerRefresh();
        }
      } else {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast('Butir soal baru berhasil ditambahkan.', 'success');
          setIsCreateModalOpen(false);
          resetForm();
          triggerRefresh();
        }
      }
    } catch {
      showToast('Gagal menyimpan soal.', 'error');
    }
  };

  const resetForm = () => {
    setFormQuestion('');
    setFormAnswer('');
    setFormOptions(['', '', '', '']);
    setFormExplanation('');
    setFormHint('');
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setFormQuestion(q.question);
    setFormAnswer(q.answer);
    setFormOptions(q.options || [q.answer, '', '', '']);
    setFormExplanation(q.explanation || '');
    setFormHint(q.hint || '');
    setFormSubject(q.subject);
    setFormGrade(q.grade);
    setFormTopic(q.topic);
    setFormCogLevel(q.cognitiveLevel);
    setFormDiff(q.difficulty);
    setIsCreateModalOpen(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Hapus butir soal ini?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Soal berhasil dihapus.', 'success');
        triggerRefresh();
      }
    } catch {
      showToast('Gagal menghapus soal.', 'error');
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      showToast('Data CSV masih kosong.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/questions/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvText, subject: 'IPS', grade: 'IX' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Berhasil mengimpor ${data.importedCount} butir soal!`, 'success');
        setIsCsvModalOpen(false);
        setCsvText('');
        triggerRefresh();
      } else {
        showToast(data.error || 'Gagal mengimpor CSV.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan impor CSV.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-700" />
              Bank Soal Kurikulum Merdeka (Fase D)
            </h1>
            <p className="text-xs text-slate-500">
              Koleksi butir soal terintegrasi KBC, Profil Lulusan & Taksonomi Bloom (C1-C6) MTsN 5 Tegal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingQuestion(null);
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Soal</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Impor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari pertanyaan / kunci..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
        >
          <option value="ALL">Semua Mata Pelajaran</option>
          <option value="IPS">IPS (Ilmu Pengetahuan Sosial)</option>
          <option value="PAI">PAI dan Budi Pekerti</option>
          <option value="MAT">Matematika</option>
          <option value="IPA">IPA</option>
          <option value="BIN">Bahasa Indonesia</option>
        </select>

        <select
          value={selectedGrade}
          onChange={e => setSelectedGrade(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
        >
          <option value="ALL">Semua Tingkat Kelas</option>
          <option value="VII">Kelas VII</option>
          <option value="VIII">Kelas VIII</option>
          <option value="IX">Kelas IX</option>
        </select>

        <select
          value={selectedCogLevel}
          onChange={e => setSelectedCogLevel(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
        >
          <option value="ALL">Semua Level Bloom (C1-C6)</option>
          <option value="C1">C1 - Mengingat</option>
          <option value="C2">C2 - Memahami</option>
          <option value="C3">C3 - Menerapkan</option>
          <option value="C4">C4 - Menganalisis</option>
          <option value="C5">C5 - Mengevaluasi</option>
          <option value="C6">C6 - Mencipta</option>
        </select>

        <select
          value={selectedDiff}
          onChange={e => setSelectedDiff(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
        >
          <option value="ALL">Semua Tingkat Kesulitan</option>
          <option value="Mudah">Mudah</option>
          <option value="Sedang">Sedang</option>
          <option value="Sulit">Sulit</option>
        </select>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Butir Soal & Kunci</th>
                <th className="py-3 px-4">Mapel & Materi</th>
                <th className="py-3 px-4">Level Bloom</th>
                <th className="py-3 px-4">Kesulitan</th>
                <th className="py-3 px-4">Nilai KBC</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {questions.length > 0 ? (
                questions.map(q => (
                  <tr key={q.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-semibold text-slate-900 leading-snug">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                          Kunci: {q.answer}
                        </span>
                        {q.hint && (
                          <span className="text-[10px] text-slate-400 truncate max-w-xs">
                            Clue: {q.hint}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{q.subject} • Kls {q.grade}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{q.topic}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-100 text-sky-800">
                        {q.cognitiveLevel || 'C3'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900">
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-emerald-800 font-semibold">
                        {q.kbcValue?.[0] || 'Cinta Ilmu'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(q)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada butir soal yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Question Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 flex justify-center items-center">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingQuestion ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teks Soal / Pertanyaan
                </label>
                <textarea
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  rows={3}
                  required
                  placeholder="Ketik soal di sini..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kunci Jawaban (1 Kata/Frasa)
                  </label>
                  <input
                    type="text"
                    value={formAnswer}
                    onChange={e => setFormAnswer(e.target.value.toUpperCase())}
                    required
                    placeholder="Misal: DISTRIBUSI"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden font-bold tracking-wider font-mono text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Petunjuk / Clue (Hint)
                  </label>
                  <input
                    type="text"
                    value={formHint}
                    onChange={e => setFormHint(e.target.value)}
                    placeholder="Clue tanpa membocorkan langsung"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="IPS">IPS</option>
                    <option value="PAI">PAI</option>
                    <option value="MAT">Matematika</option>
                    <option value="IPA">IPA</option>
                    <option value="BIN">Bahasa Indonesia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="VII">Kelas VII</option>
                    <option value="VIII">Kelas VIII</option>
                    <option value="IX">Kelas IX</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Level Bloom</label>
                  <select
                    value={formCogLevel}
                    onChange={e => setFormCogLevel(e.target.value as any)}
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
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pembahasan Edukatif</label>
                <textarea
                  value={formExplanation}
                  onChange={e => setFormExplanation(e.target.value)}
                  rows={2}
                  placeholder="Penjelasan pembahasan komprehensif..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4 flex justify-center items-center">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                Impor Soal Massal via CSV
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Tempelkan teks format CSV dengan baris tajuk (header):
              <code className="block p-2 bg-slate-100 rounded-lg text-slate-800 font-mono text-[11px] mt-1 select-all">
                question,answer,hint,explanation,subject,grade,topic,cognitive_level
              </code>
            </p>

            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              rows={8}
              placeholder={`"Kegiatan menghasilkan barang","PRODUKSI","Diawali P","Proses produksi","IPS","IX","Ekonomi Digital","C1"`}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-hidden font-mono text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleImportCsv}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                Proses Impor CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

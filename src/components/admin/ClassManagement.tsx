import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Users,
  Search,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Download
} from 'lucide-react';
import { ClassRoom } from '../../types';

interface Props {
  classes: ClassRoom[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ClassManagement: React.FC<Props> = ({ classes, onRefresh, showToast }) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'VII' | 'VIII' | 'IX'>('ALL');

  // Modal manual Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<'VII' | 'VIII' | 'IX'>('VII');
  const [waliKelas, setWaliKelas] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [submitting, setSubmitting] = useState(false);

  // Modal File Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);

  const filteredClasses = classes.filter(c => {
    const matchGrade = gradeFilter === 'ALL' || c.grade === gradeFilter;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.waliKelas && c.waliKelas.toLowerCase().includes(search.toLowerCase()));
    return matchGrade && matchSearch;
  });

  const openCreateModal = () => {
    setEditingClass(null);
    setName('');
    setGrade('VII');
    setWaliKelas('');
    setAcademicYear('2026/2027');
    setIsFormOpen(true);
  };

  const openEditModal = (c: ClassRoom) => {
    setEditingClass(c);
    setName(c.name);
    setGrade(c.grade);
    setWaliKelas(c.waliKelas || '');
    setAcademicYear(c.academicYear || '2026/2027');
    setIsFormOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama kelas tidak boleh kosong!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClass) {
        // Edit
        const res = await fetch(`/api/classes/${editingClass.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, grade, waliKelas, academicYear })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengubah data kelas');
        }
        showToast(`Kelas ${name} berhasil diperbarui`, 'success');
      } else {
        // Create
        const res = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, grade, waliKelas, academicYear })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambah kelas');
        }
        showToast(`Kelas ${name} berhasil ditambahkan`, 'success');
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (c: ClassRoom) => {
    if (!confirm(`Yakin ingin menghapus kelas "${c.name}"? Siswa di kelas ini akan menjadi tanpa kelas.`)) return;

    try {
      const res = await fetch(`/api/classes/${c.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus kelas');
      }
      showToast(`Kelas ${c.name} berhasil dihapus`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kelas', 'error');
    }
  };

  // Parse CSV / Text for Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      setUploadText(content);
    };
    reader.readAsText(file);
  };

  const handleSubmitImport = async () => {
    if (!uploadText.trim()) {
      showToast('Harap pilih file atau masukkan teks CSV data kelas terlebih dahulu.', 'error');
      return;
    }

    setUploading(true);
    try {
      // Parse CSV or tab-delimited
      const lines = uploadText.trim().split(/\r?\n/);
      const items: any[] = [];

      // Detect delimiter
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

      let startIdx = 0;
      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      
      const isHeaderRow = headers.some(h => h.includes('nama') || h.includes('kelas') || h.includes('tingkat'));
      if (isHeaderRow) startIdx = 1;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        if (cols.length >= 1 && cols[0]) {
          const name = cols[0];
          let grade: 'VII' | 'VIII' | 'IX' = 'IX';
          const rawGrade = (cols[1] || '').toUpperCase();
          if (rawGrade.includes('7') || rawGrade.includes('VII')) grade = 'VII';
          else if (rawGrade.includes('8') || rawGrade.includes('VIII')) grade = 'VIII';
          else if (rawGrade.includes('9') || rawGrade.includes('IX')) grade = 'IX';
          else if (name.startsWith('VII ') || name.startsWith('7')) grade = 'VII';
          else if (name.startsWith('VIII ') || name.startsWith('8')) grade = 'VIII';

          const waliKelas = cols[2] || '-';
          const academicYear = cols[3] || '2026/2027';

          items.push({ name, grade, waliKelas, academicYear });
        }
      }

      if (items.length === 0) {
        throw new Error('Tidak ada data kelas yang dapat diimpor dari file.');
      }

      const res = await fetch('/api/classes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengimpor data kelas');
      }

      const data = await res.json();
      showToast(data.message || 'Import data kelas berhasil!', 'success');
      setIsUploadOpen(false);
      setUploadText('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Format data file tidak valid', 'error');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = '\uFEFFNama Kelas;Tingkat;Wali Kelas;Tahun Ajaran\r\nVII A;VII;Dra. Hj. Nurjanah;2026/2027\r\nVII B;VII;Budi Santoso, S.Pd.;2026/2027\r\nVIII A;VIII;Rina Marlina, S.Si.;2026/2027\r\nIX A;IX;Supro, S.Pd.;2026/2027\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Data_Kelas_MTsN5Tegal.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Manajemen Data Kelas MTsN 5 Tegal
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola rombongan belajar (rombel), jenjang tingkatan Fase D, dan penugasan wali kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Upload File Kelas</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas Manual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-slate-500 font-bold">Tingkat:</span>
          {(['ALL', 'VII', 'VIII', 'IX'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                gradeFilter === g
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {g === 'ALL' ? 'Semua Tingkat' : `Kelas ${g}`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama kelas atau wali kelas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            Tidak ada data kelas yang cocok dengan pencarian.
          </div>
        ) : (
          filteredClasses.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200">
                      {c.name.split(' ')[0]}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Kelas {c.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Jenjang Fase D • Tingkat {c.grade}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    {c.academicYear || '2026/2027'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Wali Kelas:</span>
                    <span className="font-bold text-slate-800">{c.waliKelas || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Siswa Terdaftar:
                    </span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      {c.studentCount || 0} Siswa
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => openEditModal(c)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  onClick={() => handleDeleteClass(c)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Class */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                {editingClass ? 'Ubah Data Kelas' : 'Tambah Data Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kelas <span className="text-rose-500">*</span> (Contoh: VII A, VIII B, IX C)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VII A"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkatan</label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="VII">Kelas VII (7)</option>
                    <option value="VIII">Kelas VIII (8)</option>
                    <option value="IX">Kelas IX (9)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wali Kelas (Nama & Gelar)</label>
                <input
                  type="text"
                  placeholder="e.g. Supro, S.Pd."
                  value={waliKelas}
                  onChange={e => setWaliKelas(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
                >
                  {submitting ? 'Menyimpan...' : editingClass ? 'Simpan Perubahan' : 'Tambahkan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal File Upload Class */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Upload / Import Data Kelas (File CSV & Spreadsheet)
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> Format File yang Didukung:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  File CSV (.csv) atau teks pemisah titik-koma / koma dengan kolom:
                  <br />
                  <code className="font-bold font-mono text-emerald-950 bg-white/70 px-1.5 py-0.5 rounded">
                    Nama Kelas; Tingkat; Wali Kelas; Tahun Ajaran
                  </code>
                </p>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline pt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Contoh Template CSV Kelas
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih File CSV / Excel dari Komputer:</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atau Tempel / Paste Teks Data Kelas di Sini:</label>
                <textarea
                  rows={5}
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  placeholder={`Nama Kelas;Tingkat;Wali Kelas;Tahun Ajaran\nVII A;VII;Dra. Hj. Nurjanah;2026/2027\nVII B;VII;Budi Santoso, S.Pd.;2026/2027\nVIII A;VIII;Rina Marlina, S.Si.;2026/2027\nIX A;IX;Supro, S.Pd.;2026/2027`}
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-slate-800 text-[11px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={uploading || !uploadText.trim()}
                  onClick={handleSubmitImport}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {uploading ? 'Memproses Impor...' : 'Mulai Impor Data Kelas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

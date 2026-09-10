import React, { useState } from 'react';
import {
  Users,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Search,
  FileSpreadsheet,
  Download,
  CheckCircle,
  X,
  Filter
} from 'lucide-react';
import { User, ClassRoom } from '../../types';

interface Props {
  students: User[];
  classes: ClassRoom[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentManagement: React.FC<Props> = ({ students, classes, onRefresh, showToast }) => {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Modal manual Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal File Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);

  const filteredStudents = students.filter(s => {
    const matchClass =
      classFilter === 'ALL' ||
      s.classId === classFilter ||
      (s.studentClass && s.studentClass.toLowerCase() === classFilter.toLowerCase());
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nis && s.nis.toLowerCase().includes(search.toLowerCase())) ||
      (s.studentClass && s.studentClass.toLowerCase().includes(search.toLowerCase()));
    return matchClass && matchSearch;
  });

  const openCreateModal = () => {
    setEditingStudent(null);
    setName('');
    setNis(`212209${Math.floor(Math.random() * 90) + 10}`);
    setSelectedClassId(classes[0]?.id || '');
    setGender('L');
    setEmail('');
    setIsFormOpen(true);
  };

  const openEditModal = (s: User) => {
    setEditingStudent(s);
    setName(s.name);
    setNis(s.nis || '');
    setSelectedClassId(s.classId || (classes.find(c => c.name === s.studentClass)?.id) || '');
    setGender(s.gender || 'L');
    setEmail(s.email || '');
    setIsFormOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama siswa wajib diisi!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const cls = classes.find(c => c.id === selectedClassId);
      const studentClass = cls ? cls.name : '';

      if (editingStudent) {
        // Update
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nis,
            classId: selectedClassId,
            studentClass,
            gender,
            email
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengubah data siswa');
        }
        showToast(`Data siswa ${name} berhasil diperbarui`, 'success');
      } else {
        // Create
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nis,
            classId: selectedClassId,
            studentClass,
            gender,
            email
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambahkan siswa baru');
        }
        showToast(`Siswa baru ${name} berhasil ditambahkan`, 'success');
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (s: User) => {
    if (!confirm(`Hapus data peserta didik "${s.name}" (${s.studentClass || '-'})?`)) return;

    try {
      const res = await fetch(`/api/students/${s.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus siswa');
      }
      showToast(`Siswa ${s.name} berhasil dihapus`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus siswa', 'error');
    }
  };

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
      showToast('Pilih file CSV atau tempel teks data siswa.', 'error');
      return;
    }

    setUploading(true);
    try {
      const lines = uploadText.trim().split(/\r?\n/);
      const items: any[] = [];

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

      let startIdx = 0;
      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const isHeaderRow = headers.some(h => h.includes('nama') || h.includes('nis') || h.includes('siswa'));
      if (isHeaderRow) startIdx = 1;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        if (cols.length >= 1 && cols[0]) {
          const name = cols[0];
          const nis = cols[1] || '';
          const rawClass = cols[2] || '';
          const gender = (cols[3] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
          const email = cols[4] || '';

          items.push({ name, nis, class: rawClass, gender, email });
        }
      }

      if (items.length === 0) {
        throw new Error('Tidak ada baris data siswa yang terbaca dari file.');
      }

      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengimpor data siswa');
      }

      const data = await res.json();
      showToast(data.message || 'Import data siswa berhasil!', 'success');
      setIsUploadOpen(false);
      setUploadText('');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Format data file tidak sesuai', 'error');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      '\uFEFFNama Lengkap;NIS;Kelas;Jenis Kelamin;Email\r\n' +
      'Muhammad Raihan;21220901;IX A;L;raihan@matsamaga.sch.id\r\n' +
      'Siti Fatimah;21220902;IX A;P;fatimah@matsamaga.sch.id\r\n' +
      'Ahmad Danial Hakim;21220903;IX A;L;danial@matsamaga.sch.id\r\n' +
      'Naila Zahra Khairunnisa;21220904;IX B;P;naila@matsamaga.sch.id\r\n' +
      'Zaidan Al-Farisi;21220905;VIII A;L;zaidan@matsamaga.sch.id\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Data_Siswa_MTsN5Tegal.csv');
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
            <Users className="w-5 h-5 text-emerald-700" />
            Manajemen Data Siswa MTsN 5 Tegal
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar peserta didik aktif, nomor induk siswa (NIS), penempatan kelas, dan kredensial akun kuis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Upload File Siswa</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Manual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-600">Filter Kelas:</span>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-600/30"
          >
            <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
            {classes.map(c => (
              <option key={c.id} value={c.name}>
                Kelas {c.name} ({c.studentCount || 0} Siswa)
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama Siswa atau NIS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">L/P</th>
                <th className="py-3 px-4">Email / Akun Madrasah</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {s.nis || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                        {s.studentClass || 'Belum Ada'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          s.gender === 'P'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {s.gender || 'L'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {s.email || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Ubah Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Menampilkan {filteredStudents.length} dari total {students.length} siswa</span>
          <span>MTs Negeri 5 Tegal</span>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                {editingStudent ? 'Ubah Data Siswa' : 'Tambah Data Siswa Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Raihan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
                  <input
                    type="text"
                    placeholder="e.g. 21220901"
                    value={nis}
                    onChange={e => setNis(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rombel / Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name} (Tingkat {c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / Akun Madrasah (Opsional)</label>
                <input
                  type="email"
                  placeholder="e.g. raihan@matsamaga.sch.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  {submitting ? 'Menyimpan...' : editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal File Upload Student */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Upload / Import Data Siswa (File CSV & Spreadsheet)
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
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> Format Kolom File yang Didukung:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  File CSV (.csv) atau teks pemisah titik-koma / koma dengan susunan kolom:
                  <br />
                  <code className="font-bold font-mono text-emerald-950 bg-white/70 px-1.5 py-0.5 rounded">
                    Nama Lengkap; NIS; Kelas; Jenis Kelamin (L/P); Email
                  </code>
                </p>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline pt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Contoh Template CSV Siswa
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih File CSV Siswa:</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atau Tempel / Paste Teks Data Siswa:</label>
                <textarea
                  rows={5}
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  placeholder={`Nama Lengkap;NIS;Kelas;Jenis Kelamin;Email\nMuhammad Raihan;21220901;IX A;L;raihan@matsamaga.sch.id\nSiti Fatimah;21220902;IX A;P;fatimah@matsamaga.sch.id`}
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
                  {uploading ? 'Memproses Impor...' : 'Mulai Impor Data Siswa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

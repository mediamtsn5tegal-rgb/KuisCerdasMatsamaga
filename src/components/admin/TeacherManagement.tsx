import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Search,
  FileSpreadsheet,
  Download,
  CheckCircle,
  X,
  Code2,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { User } from '../../types';

interface Props {
  teachers: User[];
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeacherManagement: React.FC<Props> = ({ teachers, onRefresh, showToast }) => {
  const [search, setSearch] = useState('');

  // Modal manual Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState('Ilmu Pengetahuan Sosial (IPS)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal File Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploading, setUploading] = useState(false);

  const filteredTeachers = teachers.filter(t => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.nip && t.nip.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    );
  });

  const openCreateModal = () => {
    setEditingTeacher(null);
    setName('');
    setNip('');
    setSubject('Ilmu Pengetahuan Sosial (IPS)');
    setPhone('');
    setEmail('');
    setIsDeveloper(false);
    setIsFormOpen(true);
  };

  const openEditModal = (t: User) => {
    setEditingTeacher(t);
    setName(t.name);
    setNip(t.nip || '');
    setSubject(t.subject || 'Umum');
    setPhone(t.phone || '');
    setEmail(t.email || '');
    setIsDeveloper(!!t.isDeveloper || t.name.includes('Supro'));
    setIsFormOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama guru wajib diisi!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTeacher) {
        // Edit
        const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nip,
            subject,
            phone,
            email,
            isDeveloper
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal mengubah data guru');
        }
        showToast(`Data guru ${name} berhasil diperbarui`, 'success');
      } else {
        // Create
        const res = await fetch('/api/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nip,
            subject,
            phone,
            email,
            isDeveloper
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambahkan data guru');
        }
        showToast(`Guru baru ${name} berhasil ditambahkan`, 'success');
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (t: User) => {
    if (t.isDeveloper || t.name.includes('Supro')) {
      showToast('Profil pengembang utama Supro, S.Pd. dilindungi dari penghapusan.', 'error');
      return;
    }

    if (!confirm(`Hapus data pendidik "${t.name}" (${t.subject || '-'})?`)) return;

    try {
      const res = await fetch(`/api/teachers/${t.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus guru');
      }
      showToast(`Guru ${t.name} berhasil dihapus`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus guru', 'error');
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
      showToast('Pilih file CSV atau tempel teks data guru.', 'error');
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
      const isHeaderRow = headers.some(h => h.includes('nama') || h.includes('guru') || h.includes('nip'));
      if (isHeaderRow) startIdx = 1;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        if (cols.length >= 1 && cols[0]) {
          const name = cols[0];
          const nip = cols[1] || '';
          const subject = cols[2] || 'Umum';
          const email = cols[3] || '';
          const phone = cols[4] || '';

          items.push({ name, nip, subject, email, phone });
        }
      }

      if (items.length === 0) {
        throw new Error('Tidak ada baris data guru yang terbaca dari file.');
      }

      const res = await fetch('/api/teachers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengimpor data guru');
      }

      const data = await res.json();
      showToast(data.message || 'Import data guru berhasil!', 'success');
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
      '\uFEFFNama Guru;NIP;Mata Pelajaran;Email;No HP\r\n' +
      'Supro, S.Pd.;198205122009011012;IPS;supro@matsamaga.sch.id;081234567890\r\n' +
      'Dra. Hj. Nurjanah;197508202003122001;PAI;nurjanah@matsamaga.sch.id;081398765432\r\n' +
      'Budi Santoso, S.Pd.;198501152010011025;Matematika;budi@matsamaga.sch.id;081512345678\r\n' +
      'Rina Marlina, S.Si.;198804102012022003;IPA;rina@matsamaga.sch.id;081798765432\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Data_Guru_MTsN5Tegal.csv');
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
            Manajemen Data Guru & Pendidik MTsN 5 Tegal
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar dewan guru mata pelajaran, NIP, kontak, hak akses pembuat kuis, dan pengembang aplikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Upload File Guru</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru Manual</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-600">Total Terdaftar: {teachers.length} Guru</span>
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama Guru, NIP, atau Mapel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap & Gelar</th>
                <th className="py-3 px-4">NIP</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Kontak / Email</th>
                <th className="py-3 px-4 text-center">Peran Sistem</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data guru yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const isDev = t.isDeveloper || t.name.includes('Supro');
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDev ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{t.name}</span>
                          {isDev && (
                            <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <Code2 className="w-3 h-3" /> Pengembang
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {t.nip || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                          {t.subject || 'Umum'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{t.email || '-'}</span>
                        </div>
                        {t.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{t.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Guru Pembuat Soal
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Ubah Profil Guru"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isDev && (
                            <button
                              onClick={() => handleDeleteTeacher(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Guru"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Menampilkan {filteredTeachers.length} dari total {teachers.length} guru</span>
          <span className="font-bold text-emerald-800">MTs Negeri 5 Tegal</span>
        </div>
      </div>

      {/* Modal Add / Edit Teacher */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                {editingTeacher ? 'Ubah Data Guru' : 'Tambah Data Guru Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supro, S.Pd."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    placeholder="e.g. 198205122009011012"
                    value={nip}
                    onChange={e => setNip(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Diampu</label>
                  <input
                    type="text"
                    placeholder="e.g. IPS"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi</label>
                <input
                  type="email"
                  placeholder="e.g. supro@matsamaga.sch.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="e.g. 081234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  id="devCheckbox"
                  checked={isDeveloper}
                  onChange={e => setIsDeveloper(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="devCheckbox" className="font-bold text-slate-800 text-xs cursor-pointer">
                  Tandai sebagai Identitas Pengembang Aplikasi KCM MTsN 5 Tegal
                </label>
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
                  {submitting ? 'Menyimpan...' : editingTeacher ? 'Simpan Perubahan' : 'Tambahkan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal File Upload Teacher */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Upload / Import Data Guru (File CSV & Spreadsheet)
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
                    Nama Guru; NIP; Mata Pelajaran; Email; No HP
                  </code>
                </p>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline pt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Contoh Template CSV Guru
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih File CSV Guru:</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atau Tempel / Paste Teks Data Guru:</label>
                <textarea
                  rows={5}
                  value={uploadText}
                  onChange={e => setUploadText(e.target.value)}
                  placeholder={`Nama Guru;NIP;Mata Pelajaran;Email;No HP\nSupro, S.Pd.;198205122009011012;IPS;supro@matsamaga.sch.id;081234567890\nDra. Hj. Nurjanah;197508202003122001;PAI;nurjanah@matsamaga.sch.id;081398765432`}
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
                  {uploading ? 'Memproses Impor...' : 'Mulai Impor Data Guru'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

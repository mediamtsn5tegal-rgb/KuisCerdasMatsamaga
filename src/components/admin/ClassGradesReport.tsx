import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  CheckCircle,
  XCircle,
  Trophy,
  Users,
  Award,
  Calendar,
  Sparkles,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { ClassRoom, Quiz } from '../../types';

interface Props {
  classes: ClassRoom[];
  quizzes: Quiz[];
}

export const ClassGradesReport: React.FC<Props> = ({ classes, quizzes }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('c_9a');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('ALL');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const url = `/api/reports/class-results?classId=${encodeURIComponent(selectedClassId)}&quizId=${encodeURIComponent(selectedQuizId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load class report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedClassId, selectedQuizId]);

  const handleDownloadCsv = () => {
    const url = `/api/reports/class-results?classId=${encodeURIComponent(selectedClassId)}&quizId=${encodeURIComponent(selectedQuizId)}&format=csv`;
    window.location.href = url;
  };

  const handlePrint = () => {
    window.print();
  };

  const currentClassObj = classes.find(c => c.id === selectedClassId || c.name === selectedClassId);
  const className = currentClassObj ? currentClassObj.name : selectedClassId === 'ALL' ? 'Semua Kelas' : selectedClassId;

  return (
    <div className="space-y-6">
      {/* Control Card & Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              Rekapitulasi & Unduh Hasil Nilai Siswa per Kelas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih rombongan belajar dan kuis untuk melihat analisis capaian belajar, ketuntasan KKTP, serta unduh laporan resmi madrasah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Cetak Rekap</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              Pilih Rombongan Belajar (Kelas):
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name} (Tingkat {c.grade} • Wali: {c.waliKelas || '-'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              Pilih Kuis / Asesmen:
            </label>
            <select
              value={selectedQuizId}
              onChange={e => setSelectedQuizId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="ALL">Semua Asesmen / Kuis</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Madrasah Printable Header (shows when printed) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
          KEMENTERIAN AGAMA REPUBLIK INDONESIA
        </h2>
        <h1 className="text-lg font-black uppercase text-slate-900 tracking-wide">
          MADRASAH TSANAWIYAH NEGERI 5 TEGAL
        </h1>
        <p className="text-xs text-slate-600">
          Alamat: Jl. Raya Karanganyar - Dukuhturi, Kab. Tegal, Jawa Tengah • Kode Pos: 52192
        </p>
        <p className="text-xs font-bold text-slate-800 mt-2 uppercase tracking-wide underline">
          REKAPITULASI HASIL ASESMEN FORMATIF & SUMATIF SISWA BERBASIS GAMIFIKASI (KCM)
        </p>
        <div className="flex justify-between items-center text-xs font-medium text-slate-700 mt-2 px-2">
          <span>Kelas: <strong>{className}</strong></span>
          <span>Wali Kelas: <strong>{currentClassObj?.waliKelas || '-'}</strong></span>
          <span>Tahun Ajaran: <strong>{reportData?.academicYear || '2026/2027'}</strong></span>
          <span>Standar KKTP: <strong>{reportData?.kktp || 75}</strong></span>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span>Siswa Mengikuti</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {reportData.totalSubmissions}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {reportData.totalRegisteredStudents} Siswa
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Partisipasi asesmen kelas {className}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span>Rata-Rata Nilai</span>
              <TrendingUp className="w-4 h-4 text-teal-700" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {reportData.averageScore}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Tertinggi: <strong className="text-emerald-700">{reportData.maxScore}</strong> • Terendah: {reportData.minScore}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span>Ketuntasan KKTP</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {reportData.passedPercentage}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {reportData.passedCount} dari {reportData.totalSubmissions} siswa tuntas (KKTP: {reportData.kktp})
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span>Perlu Pendampingan</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600">
              {reportData.failedCount} Siswa
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Membutuhkan tindak lanjut remedial
            </p>
          </div>
        </div>
      )}

      {/* Grade Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
              Daftar Nilai Asesmen Kelas: {className}
            </h4>
            <p className="text-[11px] text-slate-500">
              Standar Kriteria Ketercapaian Tujuan Pembelajaran (KKTP): <span className="font-bold text-emerald-800">{reportData?.kktp || 75}</span>
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Total Rekaman: {reportData?.records?.length || 0} pengerjaan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-600 tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">NIS</th>
                <th className="py-3 px-4">Nama Peserta Didik</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-4">Kuis & Mode</th>
                <th className="py-3 px-3 text-center">Nilai (0-100)</th>
                <th className="py-3 px-3 text-center">Benar / Salah</th>
                <th className="py-3 px-3">Durasi</th>
                <th className="py-3 px-3 text-center">Status KKTP</th>
                <th className="py-3 px-3">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {!reportData || !reportData.records || reportData.records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm">Belum ada riwayat pengerjaan kuis untuk kelas ini.</p>
                    <p className="text-xs mt-1">Ajak siswa kelas {className} untuk mengerjakan kuis melalui kode join!</p>
                  </td>
                </tr>
              ) : (
                reportData.records.map((r: any) => (
                  <tr key={`${r.studentId}_${r.completedAt}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{r.no}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{r.nis}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.studentName}</td>
                    <td className="py-3 px-3 font-semibold text-slate-600">{r.studentClass}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-800">{r.quizTitle}</p>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                          {r.quizType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {r.score}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-[11px]">
                      <span className="text-emerald-700 font-bold">{r.correctCount}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-rose-600 font-bold">{r.wrongCount}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{r.timeSpentFormatted}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                          r.status === 'TUNTAS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status === 'TUNTAS' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-semibold text-slate-700">{r.predicate}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signatures & Note */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-10 pb-4 px-8 text-xs text-slate-900 border-t border-slate-200 mt-6">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-bold">Wali Kelas {className}</p>
            <div className="h-16"></div>
            <p className="font-bold underline">{currentClassObj?.waliKelas || '....................................'}</p>
            <p className="text-[11px]">NIP. ....................................</p>
          </div>

          <div className="text-center">
            <p>Tegal, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru Mata Pelajaran / Pengembang Aplikasi,</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Supro, S.Pd.</p>
            <p className="text-[11px]">NIP. 198205122009011012</p>
          </div>
        </div>
      </div>
    </div>
  );
};

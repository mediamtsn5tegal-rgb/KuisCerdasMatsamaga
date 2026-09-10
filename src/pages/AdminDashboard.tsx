import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLog, User, ClassRoom, Quiz, SystemSettings } from '../types';
import {
  ShieldAlert,
  Settings,
  Users,
  GraduationCap,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  ArrowLeft,
  Building,
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { DeveloperProfileCard } from '../components/admin/DeveloperProfileCard';
import { ClassManagement } from '../components/admin/ClassManagement';
import { StudentManagement } from '../components/admin/StudentManagement';
import { TeacherManagement } from '../components/admin/TeacherManagement';
import { ClassGradesReport } from '../components/admin/ClassGradesReport';
import { GoogleSheetsSyncCard } from '../components/common/GoogleSheetsSyncCard';

export const AdminDashboard: React.FC = () => {
  const { showToast, triggerRefresh, setCurrentPage } = useApp();

  const [activeTab, setActiveTab] = useState<
    'CLASSES' | 'STUDENTS' | 'TEACHERS' | 'GRADES' | 'SHEETS' | 'SETTINGS' | 'LOGS'
  >('CLASSES');

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Madrasah configuration state
  const [madrasahName, setMadrasahName] = useState('MTsN 5 Tegal');
  const [motto, setMotto] = useState('Belajar, Bermain, Berpikir, dan Berprestasi');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [kktpDefault, setKktpDefault] = useState(75);

  const loadData = async () => {
    try {
      const [clsRes, stuRes, teaRes, qzRes, logRes, setRes] = await Promise.all([
        fetch('/api/classes').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/students').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/teachers').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/quizzes').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/admin/audit-logs').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/admin/settings').then(r => (r.ok ? r.json() : null)).catch(() => null)
      ]);

      if (Array.isArray(clsRes)) setClasses(clsRes);
      if (Array.isArray(stuRes)) setStudents(stuRes);
      if (Array.isArray(teaRes)) setTeachers(teaRes);
      if (Array.isArray(qzRes)) setQuizzes(qzRes);
      if (Array.isArray(logRes)) setAuditLogs(logRes);
      if (setRes) {
        setSystemSettings(setRes);
        if (setRes.madrasahName) setMadrasahName(setRes.madrasahName);
        if (setRes.motto) setMotto(setRes.motto);
        if (setRes.academicYear) setAcademicYear(setRes.academicYear);
        if (setRes.kktpDefault) setKktpDefault(setRes.kktpDefault);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          madrasahName,
          motto,
          academicYear,
          kktpDefault
        })
      });
      if (res.ok) {
        showToast('Konfigurasi Madrasah berhasil diperbarui!', 'success');
        loadData();
      }
    } catch {
      showToast('Gagal memperbarui konfigurasi.', 'error');
    }
  };

  const handleResetData = async () => {
    if (
      !confirm(
        'Peringatan: Reset database demo akan mengembalikan data bawaan MTsN 5 Tegal (termasuk kelas, siswa, guru Supro, S.Pd., dan bank soal). Lanjutkan?'
      )
    )
      return;
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      if (res.ok) {
        showToast('Database demo berhasil di-reset ke data bawaan MTsN 5 Tegal.', 'success');
        loadData();
        triggerRefresh();
      }
    } catch {
      showToast('Gagal me-reset database.', 'error');
    }
  };

  const developerUser = teachers.find(
    t => t.isDeveloper || t.name.toLowerCase().includes('supro')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('landing')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              PANEL PENGELOLA SISTEM MADRASAH
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-700" />
              Administrasi Master Data & Nilai MTsN 5 Tegal
            </h1>
            <p className="text-xs text-slate-500">
              Kelola profil pendidik pengembang, data kelas, data siswa, data guru, serta unduh rekapitulasi nilai per kelas.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Developer Profile Card (Supro, S.Pd.) */}
      <DeveloperProfileCard
        developerUser={developerUser}
        settings={systemSettings || undefined}
        onUpdate={loadData}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('CLASSES')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'CLASSES'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Data Kelas ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'STUDENTS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Siswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TEACHERS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'TEACHERS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Data Guru ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('GRADES')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'GRADES'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Unduh Nilai Siswa</span>
        </button>

        <button
          onClick={() => setActiveTab('SHEETS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'SHEETS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Google Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'SETTINGS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Konfigurasi Madrasah</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'LOGS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Class Management */}
      {activeTab === 'CLASSES' && (
        <div className="animate-in fade-in">
          <ClassManagement classes={classes} onRefresh={loadData} showToast={showToast} />
        </div>
      )}

      {/* Tab 2: Student Management */}
      {activeTab === 'STUDENTS' && (
        <div className="animate-in fade-in">
          <StudentManagement
            students={students}
            classes={classes}
            onRefresh={loadData}
            showToast={showToast}
          />
        </div>
      )}

      {/* Tab 3: Teacher Management */}
      {activeTab === 'TEACHERS' && (
        <div className="animate-in fade-in">
          <TeacherManagement teachers={teachers} onRefresh={loadData} showToast={showToast} />
        </div>
      )}

      {/* Tab 4: Grade Reports & Download per Class */}
      {activeTab === 'GRADES' && (
        <div className="space-y-6 animate-in fade-in">
          <GoogleSheetsSyncCard onSuccess={loadData} />
          <ClassGradesReport classes={classes} quizzes={quizzes} />
        </div>
      )}

      {/* Tab 5: Google Sheets Dedicated Management */}
      {activeTab === 'SHEETS' && (
        <div className="space-y-6 animate-in fade-in">
          <GoogleSheetsSyncCard onSuccess={loadData} />
        </div>
      )}

      {/* Tab 6: Madrasah Settings */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl space-y-6 animate-in fade-in text-xs">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-emerald-700" />
            Identitas Institusi & Parameter Kuis Madrasah
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Resmi Madrasah</label>
              <input
                type="text"
                value={madrasahName}
                onChange={e => setMadrasahName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Semboyan / Motto Edukatif</label>
              <input
                type="text"
                value={motto}
                onChange={e => setMotto(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium italic text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">KKTP / KKM Default Asesmen</label>
                <input
                  type="number"
                  value={kktpDefault}
                  onChange={e => setKktpDefault(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                Simpan Perubahan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 6: Audit Logs */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 animate-in fade-in">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-emerald-700" />
            Audit Trail Aktivitas Sistem MTsN 5 Tegal
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Aktor / Pengguna</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Rincian Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

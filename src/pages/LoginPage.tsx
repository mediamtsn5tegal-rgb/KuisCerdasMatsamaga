import React, { useState } from 'react';
import { useApp, ROLE_DETAILS, FEATURE_ACCESS_MATRIX } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  School,
  FileSpreadsheet,
  Award,
  Users,
  Grid,
  ExternalLink,
  Database,
  RefreshCw
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { currentUser, loginUser, showToast, allUsers, setCurrentPage } = useApp();

  const [activePortal, setActivePortal] = useState<UserRole>('SISWA');

  // Student form state
  const [studentNis, setStudentNis] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('IX A');
  const [studentLoginMode, setStudentLoginMode] = useState<'NIS' | 'NAME'>('NIS');

  // Teacher form state
  const [teacherIdentifier, setTeacherIdentifier] = useState('supro@matsamaga.sch.id');
  const [teacherPassword, setTeacherPassword] = useState('guru123456');

  // Admin form state
  const [adminIdentifier, setAdminIdentifier] = useState('admin@matsamaga.sch.id');
  const [adminPassword, setAdminPassword] = useState('admin123456');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  // Student login submission
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = studentLoginMode === 'NIS'
        ? { nis: studentNis.trim() }
        : { name: studentName.trim(), studentClass };

      if (studentLoginMode === 'NIS' && !studentNis.trim()) {
        showToast('Silakan masukkan NIS Anda atau pilih akun demo siswa.', 'error');
        setIsSubmitting(false);
        return;
      }
      if (studentLoginMode === 'NAME' && !studentName.trim()) {
        showToast('Silakan masukkan nama lengkap siswa.', 'error');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        loginUser(data.user);
      } else {
        showToast(data.error || 'Login siswa gagal. Gunakan akun demo yang tertera.', 'error');
      }
    } catch {
      // Graceful offline/serverless fallback
      const localStudent = {
        id: `u_siswa_${Date.now()}`,
        name: studentName.trim() || 'Peserta Didik MTsN 5 Tegal',
        nis: studentNis.trim() || '21220901',
        email: 'siswa@matsamaga.sch.id',
        role: 'SISWA' as const,
        studentClass: studentClass || 'IX A',
        createdAt: new Date().toISOString()
      };
      loginUser(localStudent);
      showToast('Masuk via Mode Mandiri (Offline/Lokal).', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Teacher login submission
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!teacherIdentifier.trim()) {
        showToast('Masukkan NIP atau Email Guru.', 'error');
        setIsSubmitting(false);
        return;
      }
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: teacherIdentifier.trim(), password: teacherPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        loginUser(data.user);
      } else {
        showToast(data.error || 'Login guru gagal. Pastikan NIP/Email terdaftar.', 'error');
      }
    } catch {
      // Graceful offline/serverless fallback to Supro, S.Pd. or matched demo teacher
      const matched = demoTeachers.find(
        t => t.nip === teacherIdentifier.trim() || t.email.toLowerCase() === teacherIdentifier.toLowerCase().trim()
      );
      const teacherToLogin = matched || {
        id: 'u_guru_1',
        name: 'Supro, S.Pd.',
        nip: teacherIdentifier.trim() || '198205122009011012',
        email: 'supro@matsamaga.sch.id',
        role: 'GURU' as const,
        subject: 'IPS',
        isDeveloper: true,
        createdAt: new Date().toISOString()
      };
      loginUser(teacherToLogin);
      showToast(`Masuk sebagai ${teacherToLogin.name} via Mode Mandiri.`, 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!adminIdentifier.trim()) {
        showToast('Masukkan identitas Administrator.', 'error');
        setIsSubmitting(false);
        return;
      }
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: adminIdentifier.trim(), password: adminPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        loginUser(data.user);
      } else {
        showToast(data.error || 'Login Administrator gagal.', 'error');
      }
    } catch {
      // Graceful offline/serverless fallback
      const adminToLogin = demoAdmins[0] || {
        id: 'u_admin_1',
        name: 'Administrator MTsN 5 Tegal',
        email: 'admin@matsamaga.sch.id',
        role: 'ADMIN' as const,
        createdAt: new Date().toISOString()
      };
      loginUser(adminToLogin);
      showToast('Masuk sebagai Administrator via Mode Mandiri.', 'info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo user fast selectors
  const demoStudents = allUsers.filter(u => u.role === 'SISWA');
  const demoTeachers = allUsers.filter(u => u.role === 'GURU');
  const demoAdmins = allUsers.filter(u => u.role === 'ADMIN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Official Madrasah Logo & Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        {/* Official MTsN 5 Tegal Logo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white shadow-xl border-2 border-emerald-300 transform transition-transform hover:scale-105">
            <img
              src="/assets/logo-matsamaga.svg"
              alt="Logo Resmi MTsN 5 Tegal - Matsamaga"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide">
          <School className="w-4 h-4 text-emerald-700" />
          <span>MADRASAH TSANAWIYAH NEGERI 5 TEGAL</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
          KUIS CERDAS <span className="text-emerald-700">MATSAMAGA</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
          Portal Masuk & Pemisahan Hak Akses Resmi: Pilih peran Anda sebagai <b>Peserta Didik</b>, <b>Dewan Guru</b>, atau <b>Administrator Madrasah</b> untuk memulai.
        </p>

        {/* Developer Attribution Card */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Disupervisi & Dikembangkan oleh: <b>Supro, S.Pd.</b> (Guru IPS & Pengembang KCM)</span>
        </div>
      </div>

      {/* Active User Status Banner (if currently logged in) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#065F46] text-white flex items-center justify-center font-black text-base shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold">Sesi Aktif:</span>
              <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${ROLE_DETAILS[currentUser.role]?.badgeClass || 'bg-gray-100 text-gray-800'}`}>
                {ROLE_DETAILS[currentUser.role]?.badgeLabel || currentUser.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {currentUser.role === 'SISWA'
                ? `NIS: ${currentUser.nis || '-'} • Rombel: ${currentUser.studentClass || 'IX A'}`
                : currentUser.role === 'GURU'
                ? `NIP: ${currentUser.nip || '-'} • Pengajar ${currentUser.subject || 'IPS'}`
                : 'Pengelola Master Data Madrasah'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => {
              if (currentUser.role === 'ADMIN') setCurrentPage('admin_dashboard');
              else if (currentUser.role === 'GURU') setCurrentPage('guru_dashboard');
              else setCurrentPage('student_dashboard');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Buka Ruang Kerja Saya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Portal Selectors (Large High-Contrast Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Siswa Card Tab */}
        <button
          onClick={() => setActivePortal('SISWA')}
          className={`text-left rounded-2xl p-5 border-2 transition-all flex flex-col justify-between shadow-xs ${
            activePortal === 'SISWA'
              ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                activePortal === 'SISWA' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Portal 1
              </span>
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Portal Siswa</h3>
              <p className="text-xs text-gray-500 mt-1">
                Akses peserta didik untuk bermain kuis edukatif, cek nilai pribadi & lencana prestasi.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-100/60 flex items-center justify-between text-xs font-bold text-blue-700">
            <span>Masuk dengan NIS / Nama</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Guru Card Tab */}
        <button
          onClick={() => setActivePortal('GURU')}
          className={`text-left rounded-2xl p-5 border-2 transition-all flex flex-col justify-between shadow-xs ${
            activePortal === 'GURU'
              ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                activePortal === 'GURU' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Portal 2
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-gray-900">Portal Guru</h3>
                <span className="text-[9px] bg-amber-300 text-amber-900 font-bold px-1.5 py-0.2 rounded uppercase">
                  Pendidik
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Akses dewan guru untuk merancang kuis, generator AI C1-C6, bank soal & rekapitulasi nilai.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Masuk dengan NIP / Email</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Admin Card Tab */}
        <button
          onClick={() => setActivePortal('ADMIN')}
          className={`text-left rounded-2xl p-5 border-2 transition-all flex flex-col justify-between shadow-xs ${
            activePortal === 'ADMIN'
              ? 'bg-purple-50/70 border-purple-600 ring-2 ring-purple-500/20 shadow-md'
              : 'bg-white border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                activePortal === 'ADMIN' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Portal 3
              </span>
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Portal Administrator</h3>
              <p className="text-xs text-gray-500 mt-1">
                Akses pengelola master madrasah: kelola kelas, siswa, guru, log audit & konfigurasi sistem.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center justify-between text-xs font-bold text-purple-800">
            <span>Masuk dengan Akun Admin</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Main Login Workspace for Selected Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Presets (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Active Portal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Formulir Masuk:</span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border shadow-2xs ${ROLE_DETAILS[activePortal].badgeClass}`}>
                  {ROLE_DETAILS[activePortal].title}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {ROLE_DETAILS[activePortal].portalDescription}
              </p>
            </div>
          </div>

          {/* PORTAL SISWA FORM */}
          {activePortal === 'SISWA' && (
            <div className="space-y-6">
              {/* Toggle Input by NIS vs by Name */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStudentLoginMode('NIS')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    studentLoginMode === 'NIS'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Gunakan Nomor Induk Siswa (NIS)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentLoginMode('NAME')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    studentLoginMode === 'NAME'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Gunakan Nama & Kelas
                </button>
              </div>

              <form onSubmit={handleStudentLogin} className="space-y-4">
                {studentLoginMode === 'NIS' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Nomor Induk Siswa (NIS)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentNis}
                        onChange={e => setStudentNis(e.target.value)}
                        placeholder="Contoh: 21220901"
                        className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono text-sm font-bold text-gray-900"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Masukkan 8 digit NIS yang terdaftar di MTsN 5 Tegal.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Nama Lengkap Siswa
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="Contoh: Muhammad Raihan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Rombel / Kelas
                      </label>
                      <select
                        value={studentClass}
                        onChange={e => setStudentClass(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-bold text-gray-900 bg-white"
                      >
                        <option value="VII A">VII A</option>
                        <option value="VII B">VII B</option>
                        <option value="VIII A">VIII A</option>
                        <option value="VIII B">VIII B</option>
                        <option value="IX A">IX A</option>
                        <option value="IX B">IX B</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk Portal Peserta Didik'}</span>
                </button>
              </form>

              {/* Quick 1-Click Demo Students */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Pilih Akun Demo Siswa (1-Klik Masuk Langsung):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoStudents.slice(0, 4).map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => loginUser(st)}
                      className="text-left p-2.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700">{st.name}</p>
                        <p className="text-[10px] text-gray-400">NIS: {st.nis} • Kelas {st.studentClass}</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        Masuk
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PORTAL GURU FORM */}
          {activePortal === 'GURU' && (
            <div className="space-y-6">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    NIP atau Email Resmi Madrasah
                  </label>
                  <input
                    type="text"
                    value={teacherIdentifier}
                    onChange={e => setTeacherIdentifier(e.target.value)}
                    placeholder="Contoh: 198205122009011012 atau supro@matsamaga.sch.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold text-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Gunakan NIP 18 digit atau email terdaftar domain @matsamaga.sch.id
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi / PIN Pendidik
                  </label>
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={e => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-semibold text-gray-900"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Demo Mode: Sandi bawaan pendidik telah otomatis terisi.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk Ruang Kerja Pendidik'}</span>
                </button>
              </form>

              {/* Quick 1-Click Demo Teachers */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Pilih Akun Demo Guru (1-Klik Masuk Langsung):
                </p>
                <div className="space-y-2">
                  {demoTeachers.map(tc => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => loginUser(tc)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {tc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800">{tc.name}</p>
                            {tc.isDeveloper && (
                              <span className="text-[9px] bg-amber-300 text-amber-950 font-black px-1.5 py-0.2 rounded uppercase">
                                Pengembang
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400">
                            NIP: {tc.nip || '-'} • Guru {tc.subject || 'Mapel'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md">
                        Pilih Guru
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PORTAL ADMIN FORM */}
          {activePortal === 'ADMIN' && (
            <div className="space-y-6">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Username atau Email Administrator
                  </label>
                  <input
                    type="text"
                    value={adminIdentifier}
                    onChange={e => setAdminIdentifier(e.target.value)}
                    placeholder="admin@matsamaga.sch.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi Keamanan Pengelola
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm font-semibold text-gray-900"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Demo Mode: Sandi pengelola terisi otomatis untuk pengujian sistem.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk Panel Administrator'}</span>
                </button>
              </form>

              {/* Quick 1-Click Demo Admin */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Akun Demo Administrator (1-Klik):
                </p>
                {demoAdmins.map(ad => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => loginUser(ad)}
                    className="w-full text-left p-3 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-100/50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-purple-950">{ad.name}</p>
                      <p className="text-[10px] text-purple-700">{ad.email} • Akses Penuh Sistem</p>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-purple-700 px-2.5 py-1 rounded-md shadow-2xs">
                      Masuk Admin
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Role Privileges & Boundaries Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spesifikasi Hak Akses: Disembunyikan untuk Peserta Didik (Siswa), hanya untuk Guru dan Admin */}
          {activePortal !== 'SISWA' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Lock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900">
                  Spesifikasi Hak Akses: {ROLE_DETAILS[activePortal].title}
                </h3>
              </div>

              {/* Allowed Privileges */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fitur yang Diizinkan:</span>
                </p>
                <ul className="space-y-1.5">
                  {ROLE_DETAILS[activePortal].allowedSummary.map((item, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Restricted Privileges (if any) */}
              {ROLE_DETAILS[activePortal].restrictedSummary.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Batasan Hak Akses:</span>
                  </p>
                  <ul className="space-y-1.5">
                    {ROLE_DETAILS[activePortal].restrictedSummary.map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2 bg-rose-50/50 p-2 rounded-lg border border-rose-100/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Panduan Ramah Peserta Didik saat portal Siswa aktif */}
          {activePortal === 'SISWA' && (
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-blue-200/60">
                <GraduationCap className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-blue-950">
                  Panduan Masuk Peserta Didik
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-blue-900">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>Gunakan <b>Nomor Induk Siswa (NIS)</b> 8 digit atau pilih nama dan rombel kelas Anda.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>Disediakan opsi akun demo siswa sekali klik untuk mencoba langsung pengerjaan kuis.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>Kerjakan kuis dengan cermat, kumpulkan poin prestasi, dan raih posisi teratas di leaderboard madrasah!</span>
                </li>
              </ul>
            </div>
          )}

          {/* Quick FAQ / Info Box */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 text-xs text-emerald-950 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-emerald-900">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Butuh Bantuan Akun?</span>
            </p>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Peserta didik yang belum memiliki NIS atau lupa kelas dapat menghubungi Wali Kelas atau Guru Pengembang (Bpk. Supro, S.Pd.) di ruang laboratorium komputer MTsN 5 Tegal.
            </p>
          </div>
        </div>
      </div>

      {/* Panduan Langkah-Langkah Mengaktifkan Google Spreadsheet */}
      <div id="google-sheets-guide-section" className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Google Sheets API v4 Integrasi</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Langkah-langkah Mengaktifkan Google Spreadsheet
            </h2>
            <p className="text-xs text-gray-600 max-w-2xl">
              Panduan integrasi resmi untuk menyimpan seluruh data madrasah (kelas, siswa, guru, bank soal) serta merekap nilai asesmen formatif & sumatif secara otomatis dan real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => {
                setActivePortal('GURU');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Portal Guru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setActivePortal('ADMIN');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Portal Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Langkah Utama Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {/* Langkah 1 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              1
            </div>
            <h3 className="font-bold text-xs text-gray-900">
              Masuk Portal Guru / Admin
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Pilih portal <b>Dewan Guru</b> (akun Bpk. Supro, S.Pd.) atau <b>Administrator</b> di atas, lalu masuk dengan kredensial madrasah.
            </p>
          </div>

          {/* Langkah 2 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              2
            </div>
            <h3 className="font-bold text-xs text-gray-900">
              Buka Menu Spreadsheet
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Di Dashboard Guru, klik tombol hijau <b>"Google Spreadsheet"</b> di bar navigasi atas atau tab Spreadsheet di Admin.
            </p>
          </div>

          {/* Langkah 3 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              3
            </div>
            <h3 className="font-bold text-xs text-gray-900">
              Hubungkan Akun Google
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Cukup 1 akun madrasah (<b>mediamtsntegal@gmail.com</b>). Siswa & guru lain <b>tidak perlu</b> login Google; nilai siswa otomatis tersimpan terpusat ke spreadsheet tersebut.
            </p>
          </div>

          {/* Langkah 4 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              4
            </div>
            <h3 className="font-bold text-xs text-gray-900">
              Buat Dokumen Otomatis
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Klik <b>"Buat Spreadsheet MTsN 5 Tegal Otomatis"</b> untuk men-generate file spreadsheet dengan 6 tab terstruktur di Google Drive.
            </p>
          </div>

          {/* Langkah 5 */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
              5
            </div>
            <h3 className="font-bold text-xs text-gray-900">
              Sinkron & Simpan Real-Time
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Klik <b>"Sinkronkan Sekarang"</b>. Setiap siswa yang selesai kuis nilainya langsung masuk otomatis ke lembar kerja secara live!
            </p>
          </div>
        </div>

        {/* 6 Lembar Kerja (Sheet Tabs) Otomatis */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wide">
              Struktur 6 Lembar Kerja (Sheet Tabs) yang Dibuat Otomatis di Google Spreadsheet:
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-0.5">
              <span className="font-mono font-bold text-emerald-700 text-[10px] block">Tab 1</span>
              <p className="font-bold text-gray-800">Hasil_Asesmen_Siswa</p>
              <p className="text-[10px] text-gray-500">Nilai akhir, predikat, KKTP, durasi waktu</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-0.5">
              <span className="font-mono font-bold text-emerald-700 text-[10px] block">Tab 2</span>
              <p className="font-bold text-gray-800">Respon_Jawaban_Detail</p>
              <p className="text-[10px] text-gray-500">Rincian butir soal, kunci, jawaban siswa</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-0.5">
              <span className="font-mono font-bold text-blue-700 text-[10px] block">Tab 3</span>
              <p className="font-bold text-gray-800">Master_Kelas</p>
              <p className="text-[10px] text-gray-500">Rombel kelas Fase D (VII, VIII, IX) & wali kelas</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-0.5">
              <span className="font-mono font-bold text-blue-700 text-[10px] block">Tab 4</span>
              <p className="font-bold text-gray-800">Master_Siswa</p>
              <p className="text-[10px] text-gray-500">Basis data NIS & nama lengkap siswa</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-0.5">
              <span className="font-mono font-bold text-purple-700 text-[10px] block">Tab 5</span>
              <p className="font-bold text-gray-800">Master_Guru</p>
              <p className="text-[10px] text-gray-500">Dewan guru & profil pengembang</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 space-y-0.5">
              <span className="font-mono font-bold text-purple-700 text-[10px] block">Tab 6</span>
              <p className="font-bold text-gray-800">Master_Bank_Soal</p>
              <p className="text-[10px] text-gray-500">Arsip soal Kurikulum Merdeka Fase D</p>
            </div>
          </div>
        </div>

        {/* Collapsible Optional Matriks Hak Akses (Hidden by default) */}
        <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Informasi perizinan akses sistem per peran (Role-Based Access Control)
            </span>
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              {showMatrix ? 'Sembunyikan Matriks Hak Akses' : 'Lihat Matriks Hak Akses (Opsional)'}
            </button>
          </div>

          {showMatrix && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 animate-in fade-in">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Fitur / Modul Aplikasi</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center bg-purple-50 text-purple-900 border-x border-purple-100">
                      Administrator
                    </th>
                    <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900 border-r border-emerald-100">
                      Dewan Guru
                    </th>
                    <th className="py-3 px-3 text-center bg-blue-50 text-blue-900 border-r border-blue-100">
                      Peserta Didik
                    </th>
                    <th className="py-3 px-4">Keterangan Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {FEATURE_ACCESS_MATRIX.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{row.feature}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                          {row.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center bg-purple-50/30 border-x border-purple-100">
                        {row.admin ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-xs">✕</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-emerald-50/30 border-r border-emerald-100">
                        {row.guru ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-xs">✕</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center bg-blue-50/30 border-r border-blue-100">
                        {row.siswa ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-xs">✕</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-gray-500">{row.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

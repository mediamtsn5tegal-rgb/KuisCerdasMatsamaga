import React, { useState, useRef, useEffect } from 'react';
import { useApp, ROLE_DETAILS } from '../context/AppContext';
import {
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  PlusCircle,
  KeyRound,
  BookOpen,
  LayoutDashboard,
  ShieldAlert,
  Users,
  Trophy,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  Grid,
  Search,
  CheckSquare,
  Image as ImageIcon,
  Zap,
  Layers,
  Compass,
  LogIn,
  LogOut,
  Lock,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentPage,
    setCurrentPage,
    setActiveQuizCode,
    soundEnabled,
    toggleSound,
    switchDemoRole,
    logoutUser
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = (page: any) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setRoleDropdownOpen(false);
    setFeaturesDropdownOpen(false);
  };

  const playDemoQuiz = (code: string) => {
    setActiveQuizCode(code);
    setCurrentPage('join');
    setMobileMenuOpen(false);
    setFeaturesDropdownOpen(false);
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#065F46] text-white flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-md border-b border-[#047857] no-print">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Titles */}
        <div
          onClick={() => navigate('landing')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <span className="text-[#065F46] font-black text-lg sm:text-xl leading-none">KCM</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base leading-tight uppercase tracking-tight text-white">
                Kuis Cerdas Matsamaga
              </h1>
              <span className="hidden md:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-emerald-100 border border-white/20">
                MTsN 5 Tegal
              </span>
            </div>
            <p className="text-[10px] text-emerald-100/80 uppercase tracking-widest font-medium hidden sm:block">
              Platform Kuis Interaktif • Asesmen Terpadu
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Beranda */}
          <button
            onClick={() => navigate('landing')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentPage === 'landing'
                ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
            }`}
          >
            Beranda
          </button>

          {/* Gabung Kuis */}
          <button
            onClick={() => navigate('join')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              currentPage === 'join' || currentPage === 'play' || currentPage === 'gameplay'
                ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
            Gabung Kuis
          </button>

          {/* Role Based Link: Kuis Saya for Guru/Admin or Pencapaian for Siswa */}
          {currentUser.role === 'SISWA' ? (
            <button
              onClick={() => navigate('student_dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'student_dashboard'
                  ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                  : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              Pencapaian Saya
            </button>
          ) : (
            <button
              onClick={() => navigate('guru_dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'guru_dashboard'
                  ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                  : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-300" />
              Kuis Saya
            </button>
          )}

          {/* Bank Soal for Guru & Admin */}
          {(currentUser.role === 'GURU' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => navigate('question_bank')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'question_bank'
                  ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                  : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              Bank Soal
            </button>
          )}

          {/* AI Generator for Guru & Admin */}
          {(currentUser.role === 'GURU' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => navigate('ai_generator')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'ai_generator'
                  ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                  : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Generator</span>
              <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                Hot
              </span>
            </button>
          )}

          {/* Papan Peringkat / Leaderboard - accessible to ALL */}
          <button
            onClick={() => navigate('leaderboard')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              currentPage === 'leaderboard'
                ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            Peringkat
          </button>

          {/* Analisis & Nilai for Guru & Admin */}
          {(currentUser.role === 'GURU' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => navigate('analytics')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'analytics'
                  ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                  : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
              Analisis
            </button>
          )}

          {/* Admin & Data Panel for Guru & Admin */}
          {(currentUser.role === 'ADMIN' || currentUser.role === 'GURU') && (
            <button
              onClick={() => navigate('admin_dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                currentPage === 'admin_dashboard'
                  ? 'bg-[#047857] text-white border border-[#10B981]/50 shadow-xs'
                  : 'text-emerald-100/90 hover:text-white hover:bg-[#047857]/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-300" />
              Kelola Data & Nilai
            </button>
          )}

          {/* Dedicated Portal Login & RBAC button */}
          <button
            onClick={() => navigate('login')}
            title="Portal Masuk & Hak Akses Akun"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              currentPage === 'login'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-amber-300" />
            <span>Portal Login</span>
          </button>

          {/* All Features Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-100/90 hover:text-white hover:bg-[#047857]/60 transition-colors flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-300" />
              <span>Semua Menu</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {featuresDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 text-gray-800 animate-in fade-in zoom-in-95">
                <div className="px-3.5 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Jelajah Fitur KCM
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    6 Mode Aktif
                  </span>
                </div>

                <div className="px-2 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider px-2 py-1">
                    🎮 6 Mode Permainan
                  </div>

                  <button
                    onClick={() => playDemoQuiz('KCM-9A7X2')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Grid className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-emerald-700">Teka-Teki Silang (TTS)</p>
                        <p className="text-[10px] text-gray-400">Kode: KCM-9A7X2</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">Main</span>
                  </button>

                  <button
                    onClick={() => playDemoQuiz('KCM-8W5R1')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-teal-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-teal-600" />
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-teal-700">Word Search (Cari Kata)</p>
                        <p className="text-[10px] text-gray-400">Kode: KCM-8W5R1</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">Main</span>
                  </button>

                  <button
                    onClick={() => playDemoQuiz('KCM-7P4G9')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-700">Pilihan Ganda Interaktif</p>
                        <p className="text-[10px] text-gray-400">Kode: KCM-7P4G9</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">Main</span>
                  </button>

                  <button
                    onClick={() => playDemoQuiz('KCM-6T2B4')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-amber-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-amber-700">Tebak Gambar</p>
                        <p className="text-[10px] text-gray-400">Kode: KCM-6T2B4</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">Main</span>
                  </button>

                  <button
                    onClick={() => playDemoQuiz('KCM-5K9Z3')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-rose-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-rose-600" />
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-rose-700">Kuis Cepat (10 Detik)</p>
                        <p className="text-[10px] text-gray-400">Kode: KCM-5K9Z3</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded">Main</span>
                  </button>

                  <button
                    onClick={() => playDemoQuiz('KCM-ROOM-9A')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-purple-700">Kompetisi Live Room</p>
                        <p className="text-[10px] text-gray-400">Kode: KCM-ROOM-9A</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded">Masuk</span>
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 px-2 space-y-1">
                  {currentUser.role === 'SISWA' ? (
                    <>
                      <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Ruang Peserta Didik</span>
                      </div>
                      <button
                        onClick={() => navigate('student_dashboard')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pencapaian & Riwayat Nilai Saya</span>
                      </button>
                      <button
                        onClick={() => navigate('leaderboard')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Trophy className="w-3.5 h-3.5 text-blue-600" />
                        <span>Papan Peringkat Madrasah</span>
                      </button>
                      <button
                        onClick={() => navigate('join')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Masukkan Kode Kuis Baru</span>
                      </button>
                      <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-500 flex items-start gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <span>Modul Guru & Admin terkunci. Beralih peran via Portal Login.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider px-2 py-1">
                        📚 Modul & Alat Pendidik / Madrasah
                      </div>
                      <button
                        onClick={() => navigate('quiz_builder')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Buat Kuis Baru (Wizard 4 Langkah)</span>
                      </button>
                      <button
                        onClick={() => navigate('question_bank')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bank Soal Terstandar</span>
                      </button>
                      <button
                        onClick={() => navigate('ai_generator')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI Quiz Generator Cerdas</span>
                      </button>
                      <button
                        onClick={() => navigate('analytics')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Analisis Butir Soal & Daya Serap</span>
                      </button>
                      <button
                        onClick={() => navigate('admin_dashboard')}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-emerald-50 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Kelola Data Kelas, Siswa, Guru & Nilai</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Controls: User identity info, Sound Toggle, Role Switcher, Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center gap-2.5 pr-2 border-r border-emerald-600/50">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <p className="text-xs font-bold leading-tight text-white">{currentUser.name}</p>
                {(currentUser.isDeveloper || currentUser.name.includes('Supro')) && (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase">
                    Pengembang
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-200/90 tracking-tight">
                {currentUser.isDeveloper || currentUser.name.includes('Supro')
                  ? 'Guru IPS & Pengembang KCM'
                  : currentUser.role === 'GURU'
                  ? `Guru Mapel • ${currentUser.subject || 'IPS'}`
                  : currentUser.role === 'ADMIN'
                  ? 'Admin Madrasah'
                  : `Peserta Didik • ${currentUser.studentClass || 'IX A'}`}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#047857] border-2 border-[#10B981] flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {getInitials(currentUser.name)}
            </div>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-[#047857] transition-colors border border-emerald-600/60"
            aria-label="Efek Suara"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-emerald-300/60" />
            )}
          </button>

          {/* Role Switcher Pill & Authentication Menu */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/50 bg-[#047857] hover:bg-[#059669] transition-colors text-xs font-bold text-white shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-emerald-200" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
                {/* Active user status header */}
                <div className="px-3 pb-2 mb-1 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peran Saat Ini</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${ROLE_DETAILS[currentUser.role]?.badgeClass}`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</p>
                </div>

                {/* Primary Button: Open Full RBAC Login Portal */}
                <div className="px-2 py-1">
                  <button
                    onClick={() => {
                      navigate('login');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Portal Login & Hak Akses</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-normal">RBAC</span>
                  </button>
                </div>

                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Simulasi Ganti Cepat (Demo)
                </div>
                <button
                  onClick={() => {
                    switchDemoRole('GURU');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                    currentUser.role === 'GURU' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <span className="block font-bold">Dewan Guru (Supro, S.Pd.)</span>
                    <span className="text-[10px] text-gray-400">NIP: 198205122009011012</span>
                  </div>
                  {currentUser.role === 'GURU' && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                </button>
                <button
                  onClick={() => {
                    switchDemoRole('ADMIN');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                    currentUser.role === 'ADMIN' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <span className="block font-bold">Administrator Madrasah</span>
                    <span className="text-[10px] text-gray-400">admin@matsamaga.sch.id</span>
                  </div>
                  {currentUser.role === 'ADMIN' && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                </button>
                <button
                  onClick={() => {
                    switchDemoRole('SISWA');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                    currentUser.role === 'SISWA' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <span className="block font-bold">Peserta Didik (Muhammad Raihan)</span>
                    <span className="text-[10px] text-gray-400">NIS: 21220901 • Kelas IX A</span>
                  </div>
                  {currentUser.role === 'SISWA' && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                </button>

                {/* Logout Action */}
                <div className="mt-1 pt-1 border-t border-gray-100 px-2">
                  <button
                    onClick={() => {
                      logoutUser();
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar / Ganti Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          {currentUser.role === 'GURU' || currentUser.role === 'ADMIN' ? (
            <button
              onClick={() => navigate('quiz_builder')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Buat Kuis</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('join')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Mulai Kuis</span>
            </button>
          )}

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-[#047857]"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 lg:hidden border-t border-emerald-600/50 bg-[#065F46] text-white px-4 pt-3 pb-8 space-y-4 shadow-2xl z-50 max-h-[calc(100vh-64px)] overflow-y-auto">
          {/* User Profile Mini Bar on Mobile */}
          <div className="flex items-center justify-between pb-3 border-b border-emerald-600/40">
            <div>
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-200">
                Peran: <b className="uppercase">{currentUser.role}</b>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#047857] border border-[#10B981] flex items-center justify-center text-xs font-bold text-white">
              {getInitials(currentUser.name)}
            </div>
          </div>

          {/* Section 1: Main Links */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block px-1">
              Navigasi Utama
            </span>
            <button
              onClick={() => navigate('landing')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#047857] flex items-center gap-2"
            >
              <span>Beranda</span>
            </button>
            <button
              onClick={() => navigate('login')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 flex items-center gap-2 shadow-xs"
            >
              <LogIn className="w-4 h-4 text-amber-950" />
              <span>Portal Login & Hak Akses (RBAC)</span>
            </button>
            <button
              onClick={() => navigate('join')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-100 hover:bg-[#047857] flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-emerald-300" />
              <span>Gabung Kuis (Masukkan Kode)</span>
            </button>
            <button
              onClick={() => navigate('leaderboard')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-100 hover:bg-[#047857] flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Papan Peringkat (Leaderboard)</span>
            </button>
          </div>

          {/* Section 2: 6 Game Modes */}
          <div className="space-y-1 pt-2 border-t border-emerald-600/40">
            <span className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block px-1">
              6 Mode Game Edukatif
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => playDemoQuiz('KCM-9A7X2')}
                className="text-left p-2 rounded-lg bg-[#047857]/80 hover:bg-[#047857] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Grid className="w-3.5 h-3.5 text-emerald-300" />
                <span>TTS Silang</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-8W5R1')}
                className="text-left p-2 rounded-lg bg-[#047857]/80 hover:bg-[#047857] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-teal-300" />
                <span>Word Search</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-7P4G9')}
                className="text-left p-2 rounded-lg bg-[#047857]/80 hover:bg-[#047857] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-300" />
                <span>Pilihan Ganda</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-6T2B4')}
                className="text-left p-2 rounded-lg bg-[#047857]/80 hover:bg-[#047857] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Tebak Gambar</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-5K9Z3')}
                className="text-left p-2 rounded-lg bg-[#047857]/80 hover:bg-[#047857] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-rose-300" />
                <span>Kuis Cepat</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-ROOM-9A')}
                className="text-left p-2 rounded-lg bg-[#047857]/80 hover:bg-[#047857] text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-purple-300" />
                <span>Live Room</span>
              </button>
            </div>
          </div>

          {/* Section 3: Teacher & School Management (Only if Guru or Admin) */}
          {currentUser.role !== 'SISWA' ? (
            <div className="space-y-1 pt-2 border-t border-emerald-600/40">
              <span className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block px-1">
                Fitur Pendidik & Madrasah
              </span>
              <button
                onClick={() => navigate('guru_dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#047857] flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                <span>Dashboard Kuis Saya</span>
              </button>
              <button
                onClick={() => navigate('quiz_builder')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>+ Buat Kuis Baru</span>
              </button>
              <button
                onClick={() => navigate('question_bank')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#047857] flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Bank Soal Terstandar</span>
              </button>
              <button
                onClick={() => navigate('ai_generator')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-200 hover:bg-[#047857] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Quiz Generator</span>
              </button>
              <button
                onClick={() => navigate('analytics')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#047857] flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-emerald-300" />
                <span>Analisis Butir Soal & Rekap Nilai</span>
              </button>
              <button
                onClick={() => navigate('admin_dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#047857] flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-emerald-300" />
                <span>Panel Kelola Data Madrasah</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1 pt-2 border-t border-emerald-600/40">
              <span className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider block px-1">
                Ruang Peserta Didik
              </span>
              <button
                onClick={() => navigate('student_dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-white hover:bg-[#047857] flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Pencapaian & Nilai Siswa</span>
              </button>
            </div>
          )}

          {/* Section 4: Logout */}
          <div className="pt-3 border-t border-emerald-600/40">
            <button
              onClick={() => {
                logoutUser();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-900/40 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

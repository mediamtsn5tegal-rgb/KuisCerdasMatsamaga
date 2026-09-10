import React from 'react';
import { useApp, PageView, ROLE_DETAILS } from '../context/AppContext';
import {
  KeyRound,
  Trophy,
  Grid,
  Search,
  CheckSquare,
  Image as ImageIcon,
  Zap,
  Users,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Award,
  LogOut,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Sparkle,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logoutUser,
    soundEnabled,
    toggleSound,
    setActiveQuizCode
  } = useApp();

  const handleNav = (page: PageView) => {
    setCurrentPage(page);
    onClose();
  };

  const playDemoQuiz = (code: string) => {
    setActiveQuizCode(code);
    setCurrentPage('join');
    onClose();
  };

  const isActive = (page: PageView) => currentPage === page;

  const role = currentUser.role;
  const isTeacherOrAdmin = role === 'GURU' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#064E3B] text-white flex flex-col border-r border-emerald-800 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header: Official MTsN 5 Tegal Logo & Title */}
        <div className="p-4 border-b border-emerald-700/60 bg-[#047857]/40 flex items-center justify-between">
          <div
            onClick={() => handleNav('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full p-0.5 bg-white shadow-md shrink-0 transition-transform group-hover:scale-105">
              <img
                src="/assets/logo-matsamaga.svg"
                alt="Logo Resmi MTsN 5 Tegal"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                KUIS CERDAS
              </span>
              <span className="font-black text-xs text-amber-300 tracking-wider">
                MATSAMAGA
              </span>
              <span className="text-[10px] text-emerald-200/90 tracking-tighter truncate">
                MTs Negeri 5 Tegal
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-[#047857] transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Profile */}
        <div className="px-4 py-3 bg-[#022c22]/50 border-b border-emerald-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 border-2 border-emerald-400 flex items-center justify-center font-bold text-white shadow-xs shrink-0 text-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider border ${
                    ROLE_DETAILS[role]?.badgeClass || 'bg-emerald-900 text-emerald-200'
                  }`}
                >
                  {role}
                </span>
                {(currentUser.isDeveloper || currentUser.name.includes('Supro')) && (
                  <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                    Pengembang
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-300/80 truncate mt-0.5">
                {role === 'SISWA'
                  ? `Kelas ${currentUser.studentClass || 'IX A'}`
                  : role === 'GURU'
                  ? `Guru Mapel • ${currentUser.subject || 'IPS'}`
                  : 'Admin Madrasah'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu Scroll Area */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-medium scrollbar-thin scrollbar-thumb-emerald-700">
          {/* Section: Beranda & Kuis Interaktif */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider">
              Asesmen & Kuis
            </span>
            <button
              onClick={() => handleNav('landing')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                isActive('landing')
                  ? 'bg-emerald-500 text-white font-bold shadow-md'
                  : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span>Beranda Asesmen</span>
            </button>
            <button
              onClick={() => handleNav('join')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                isActive('join')
                  ? 'bg-emerald-500 text-white font-bold shadow-md'
                  : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-300" />
              <span>Gabung Kuis (Kode PIN)</span>
            </button>
            <button
              onClick={() => handleNav('leaderboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                isActive('leaderboard')
                  ? 'bg-emerald-500 text-white font-bold shadow-md'
                  : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Papan Peringkat Madrasah</span>
            </button>
          </div>

          {/* Section: 6 Mode Game Edukatif */}
          <div className="space-y-1 pt-2 border-t border-emerald-800/80">
            <span className="px-2 text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider">
              6 Mode Permainan
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => playDemoQuiz('KCM-9A7X2')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#022c22]/40 hover:bg-[#047857] text-[11px] text-emerald-100 hover:text-white transition-colors text-left"
              >
                <Grid className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">TTS Silang</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-8W5R1')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#022c22]/40 hover:bg-[#047857] text-[11px] text-emerald-100 hover:text-white transition-colors text-left"
              >
                <Search className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span className="truncate">Cari Kata</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-7P4G9')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#022c22]/40 hover:bg-[#047857] text-[11px] text-emerald-100 hover:text-white transition-colors text-left"
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span className="truncate">Pilihan Ganda</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-6T2B4')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#022c22]/40 hover:bg-[#047857] text-[11px] text-emerald-100 hover:text-white transition-colors text-left"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">Tebak Gambar</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-5K9Z3')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#022c22]/40 hover:bg-[#047857] text-[11px] text-emerald-100 hover:text-white transition-colors text-left"
              >
                <Zap className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                <span className="truncate">Kuis Cepat</span>
              </button>
              <button
                onClick={() => playDemoQuiz('KCM-ROOM-9A')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#022c22]/40 hover:bg-[#047857] text-[11px] text-emerald-100 hover:text-white transition-colors text-left"
              >
                <Users className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                <span className="truncate">Live Room</span>
              </button>
            </div>
          </div>

          {/* Section: Peserta Didik Only */}
          {role === 'SISWA' && (
            <div className="space-y-1 pt-2 border-t border-emerald-800/80">
              <span className="px-2 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                Ruang Peserta Didik
              </span>
              <button
                onClick={() => handleNav('student_dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('student_dashboard')
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Pencapaian & Riwayat Nilai</span>
              </button>
            </div>
          )}

          {/* Section: Guru & Admin Modules */}
          {isTeacherOrAdmin && (
            <div className="space-y-1 pt-2 border-t border-emerald-800/80">
              <span className="px-2 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Modul Dewan Guru
              </span>
              <button
                onClick={() => handleNav('guru_dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('guru_dashboard')
                    ? 'bg-emerald-500 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                <span>Dashboard Kuis Saya</span>
              </button>
              <button
                onClick={() => handleNav('quiz_builder')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('quiz_builder')
                    ? 'bg-emerald-500 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-300" />
                <span>+ Buat Kuis (Wizard 4 Tahap)</span>
              </button>
              <button
                onClick={() => handleNav('question_bank')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('question_bank')
                    ? 'bg-emerald-500 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Bank Soal Terstandar</span>
              </button>
              <button
                onClick={() => handleNav('ai_generator')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('ai_generator')
                    ? 'bg-emerald-500 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Quiz Generator (Bloom)</span>
              </button>
              <button
                onClick={() => handleNav('analytics')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('analytics')
                    ? 'bg-emerald-500 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-300" />
                <span>Analisis Butir & Rekap Nilai</span>
              </button>
            </div>
          )}

          {/* Section: Master Data & Madrasah Management */}
          {isTeacherOrAdmin && (
            <div className="space-y-1 pt-2 border-t border-emerald-800/80">
              <span className="px-2 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Manajemen Madrasah
              </span>
              <button
                onClick={() => handleNav('admin_dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  isActive('admin_dashboard')
                    ? 'bg-purple-700 text-white font-bold shadow-md'
                    : 'text-emerald-100 hover:bg-[#047857] hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-300" />
                <span>Kelola Data Kelas, Siswa & Guru</span>
              </button>
            </div>
          )}

          {/* Section: Portal Hak Akses */}
          <div className="pt-2 border-t border-emerald-800/80">
            <button
              onClick={() => handleNav('login')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                isActive('login')
                  ? 'bg-amber-400 text-amber-950 font-bold shadow-md'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-amber-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-amber-400" />
                <span>Ganti Portal / Akun</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </nav>

        {/* Footer of Sidebar */}
        <div className="p-3 border-t border-emerald-800/80 bg-[#022c22]/70 space-y-2">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between px-2 py-1 bg-emerald-950/40 rounded-lg text-xs">
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-emerald-400/60" />}
              <span>Efek Suara</span>
            </span>
            <button
              onClick={toggleSound}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                soundEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {soundEnabled ? 'AKTIF' : 'MATI'}
            </button>
          </div>

          {/* Developer Credit Note */}
          <div className="px-2 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-[10px] text-emerald-200/90 leading-tight">
            <p className="font-bold text-amber-300">Pengembang Aplikasi:</p>
            <p className="text-white font-semibold">Supro, S.Pd.</p>
            <p className="text-emerald-300/70 text-[9px]">Guru IPS MTsN 5 Tegal</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logoutUser();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition-colors border border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar ke Halaman Awal</span>
          </button>
        </div>
      </aside>
    </>
  );
};

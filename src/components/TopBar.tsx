import React from 'react';
import { useApp, PageView, ROLE_DETAILS } from '../context/AppContext';
import {
  Menu,
  KeyRound,
  PlusCircle,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logoutUser,
    soundEnabled,
    toggleSound
  } = useApp();

  const getPageTitle = (page: PageView) => {
    switch (page) {
      case 'landing':
        return 'Beranda Kuis Cerdas';
      case 'join':
        return 'Gabung Arena Kuis';
      case 'student_dashboard':
        return 'Pencapaian & Riwayat Nilai Siswa';
      case 'guru_dashboard':
        return 'Dashboard Dewan Guru';
      case 'quiz_builder':
        return 'Pembuat Kuis Interaktif (Wizard 4 Langkah)';
      case 'question_bank':
        return 'Bank Soal Terstandar Madrasah';
      case 'ai_generator':
        return 'AI Quiz Generator Cerdas';
      case 'analytics':
        return 'Analisis Butir Soal & Daya Serap';
      case 'admin_dashboard':
        return 'Panel Kelola Data Madrasah (Kelas, Siswa, Guru & Nilai)';
      case 'google_sheets':
        return 'Integrasi Otomatis Google Spreadsheet & Apps Script';
      case 'leaderboard':
        return 'Papan Peringkat Prestasi Madrasah';
      case 'play':
      case 'gameplay':
        return 'Permainan Asesmen Berlangsung';
      case 'result':
        return 'Hasil & Laporan Evaluasi Kuis';
      case 'login':
        return 'Portal Masuk & Hak Akses';
      default:
        return 'Kuis Cerdas Matsamaga';
    }
  };

  const isTeacherOrAdmin = currentUser.role === 'GURU' || currentUser.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Left: Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-hidden"
          title="Buka / Tutup Menu Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5 text-emerald-800" />
        </button>

        {/* Small School Logo in Header for Branding */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white border border-emerald-200 p-0.5 shadow-2xs shrink-0 hidden sm:block">
            <img
              src="/assets/logo-matsamaga.svg"
              alt="Logo MTsN 5 Tegal"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate max-w-[200px] sm:max-w-md">
              {getPageTitle(currentPage)}
            </h1>
            <span className="text-[10px] text-gray-400 font-medium hidden sm:block">
              MTs Negeri 5 Tegal • Kuis Cerdas Matsamaga
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
          className="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors border border-gray-200"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Action Button: Google Sheets & Quick Quiz */}
        {isTeacherOrAdmin ? (
          <>
            <button
              onClick={() => setCurrentPage('google_sheets')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                currentPage === 'google_sheets'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
              title="Buka Sinkronisasi Google Spreadsheet & Apps Script"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Google Spreadsheet</span>
              <span className="text-[9px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded font-black">
                Apps Script
              </span>
            </button>

            <button
              onClick={() => setCurrentPage('quiz_builder')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Buat Kuis</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setCurrentPage('join')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Mulai Kuis</span>
          </button>
        )}

        {/* User Mini Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-xs font-bold text-gray-800 leading-tight">{currentUser.name}</span>
              {(currentUser.isDeveloper || currentUser.name.includes('Supro')) && (
                <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Pengembang
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              {currentUser.role === 'SISWA'
                ? `Siswa (${currentUser.studentClass || 'IX A'})`
                : currentUser.role === 'GURU'
                ? `Guru (${currentUser.subject || 'IPS'})`
                : 'Administrator'}
            </p>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[#065F46] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={() => logoutUser()}
            title="Keluar / Kembali ke Halaman Awal"
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

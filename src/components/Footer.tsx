import React from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Award, ShieldCheck, Trophy, Sparkles, BookOpen, KeyRound } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage, setActiveQuizCode } = useApp();

  const playQuiz = (code: string) => {
    setActiveQuizCode(code);
    setCurrentPage('join');
  };

  return (
    <footer className="bg-white text-gray-600 border-t border-gray-200 mt-16 shrink-0 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Col 1: Identity */}
          <div className="md:col-span-1 space-y-3">
            <div
              onClick={() => setCurrentPage('landing')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-xs border border-emerald-200 shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/assets/logo-matsamaga.svg"
                  alt="Logo Resmi MTsN 5 Tegal - Matsamaga"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight uppercase group-hover:text-emerald-700 transition-colors">
                  Kuis Cerdas Matsamaga
                </h3>
                <p className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase">
                  MTs Negeri 5 Tegal
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Platform asesmen formatif & sumatif interaktif madrasah berbasis game-based learning. Mengintegrasikan Kurikulum Merdeka Fase D, Kurikulum Berbasis Cinta (KBC), dan 8 Dimensi Profil Lulusan.
            </p>
          </div>

          {/* Col 2: Fitur & Mode Kuis */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              6 Mode Permainan
            </h4>
            <ul className="text-xs space-y-1.5 text-gray-500">
              <li>
                <button
                  onClick={() => playQuiz('KCM-9A7X2')}
                  className="hover:text-emerald-700 transition-colors text-left"
                >
                  • Teka-Teki Silang & Cetak LKPD
                </button>
              </li>
              <li>
                <button
                  onClick={() => playQuiz('KCM-8W5R1')}
                  className="hover:text-emerald-700 transition-colors text-left"
                >
                  • Word Search (Cari Kata)
                </button>
              </li>
              <li>
                <button
                  onClick={() => playQuiz('KCM-7P4G9')}
                  className="hover:text-emerald-700 transition-colors text-left"
                >
                  • Pilihan Ganda Interaktif
                </button>
              </li>
              <li>
                <button
                  onClick={() => playQuiz('KCM-6T2B4')}
                  className="hover:text-emerald-700 transition-colors text-left"
                >
                  • Tebak Gambar Interaktif
                </button>
              </li>
              <li>
                <button
                  onClick={() => playQuiz('KCM-5K9Z3')}
                  className="hover:text-emerald-700 transition-colors text-left"
                >
                  • Kuis Cepat (10 Detik)
                </button>
              </li>
              <li>
                <button
                  onClick={() => playQuiz('KCM-ROOM-9A')}
                  className="hover:text-emerald-700 transition-colors text-left"
                >
                  • Mode Kompetisi Live Room
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Modul & Navigasi Madrasah */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Menu Navigasi
            </h4>
            <ul className="text-xs space-y-1.5 text-gray-500">
              <li>
                <button
                  onClick={() => setCurrentPage('landing')}
                  className="hover:text-emerald-700 transition-colors"
                >
                  • Beranda Utama
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('join')}
                  className="hover:text-emerald-700 transition-colors"
                >
                  • Gabung Kuis dengan Kode
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('leaderboard')}
                  className="hover:text-emerald-700 transition-colors"
                >
                  • Papan Peringkat (Leaderboard)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('question_bank')}
                  className="hover:text-emerald-700 transition-colors"
                >
                  • Bank Soal Terstandar
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('ai_generator')}
                  className="hover:text-emerald-700 transition-colors"
                >
                  • AI Quiz Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('analytics')}
                  className="hover:text-emerald-700 transition-colors"
                >
                  • Analisis Butir Soal & Daya Serap
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Visi Madrasah & Pengembang Aplikasi */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Visi Madrasah
            </h4>
            <blockquote className="text-xs text-gray-600 leading-relaxed border-l-2 border-emerald-600 pl-2.5 italic">
              "Unggul dalam Prestasi, Tangguh dalam Kompetisi, dan Luhur dalam Budi Pekerti."
            </blockquote>
            
            {/* Profil Guru & Pengembang Aplikasi */}
            <div className="mt-3 p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  SP
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">
                    Pengembang Aplikasi
                  </p>
                  <p className="text-xs font-bold text-gray-900">
                    Supro, S.Pd.
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Guru Mapel IPS • MTs Negeri 5 Tegal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* High Density Bottom Status Bar */}
      <div className="h-9 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 flex items-center justify-between text-[10px] font-medium text-gray-500 uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span className="font-bold text-emerald-800">Sistem Versi 2.4.0</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:inline-block"></span>
          <span className="text-gray-500 hidden sm:inline-block">Pengembang: <strong className="text-gray-700">Supro, S.Pd.</strong></span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <span>© {new Date().getFullYear()} MTsN 5 Tegal • Jawa Tengah</span>
        </div>
      </div>
    </footer>
  );
};

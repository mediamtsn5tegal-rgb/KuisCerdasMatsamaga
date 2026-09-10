import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Sparkles,
  Grid,
  Search,
  CheckSquare,
  Image as ImageIcon,
  Zap,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Heart,
  Award,
  BookOpen,
  Play
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentPage, setActiveQuizCode, switchDemoRole } = useApp();
  const [pinInput, setPinInput] = useState('');

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim()) {
      setActiveQuizCode(pinInput.trim().toUpperCase());
      setCurrentPage('join');
    }
  };

  const playDemoGame = (code: string) => {
    setActiveQuizCode(code);
    setCurrentPage('join');
  };

  const gameModes = [
    {
      id: 'crossword',
      title: 'Teka-Teki Silang (TTS)',
      code: 'KCM-9A7X2',
      description: 'Permainan kata bersilang edukatif dengan petunjuk mendatar & menurun. Dilengkapi generator cerdas dan fitur cetak LKPD.',
      icon: Grid,
      badge: 'Game Utama',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      color: 'from-emerald-700 to-emerald-600'
    },
    {
      id: 'wordsearch',
      title: 'Word Search (Cari Kata)',
      code: 'KCM-8W5R1',
      description: 'Temukan istilah ekonomi digital & madrasah dalam matriks huruf tersembunyi secara horizontal, vertikal, dan diagonal.',
      icon: Search,
      badge: 'Fokus Visual',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      color: 'from-teal-700 to-teal-600'
    },
    {
      id: 'mcq',
      title: 'Pilihan Ganda Interaktif',
      code: 'KCM-7P4G9',
      description: 'Asesmen formatif & sumatif komprehensif dengan pembahasan langsung, petunjuk bertahap, dan pintasan papan ketik.',
      icon: CheckSquare,
      badge: 'Asesmen Formal',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      color: 'from-blue-700 to-blue-600'
    },
    {
      id: 'picture',
      title: 'Tebak Gambar',
      code: 'KCM-6T2B4',
      description: 'Analisis visual aktivitas ekonomi, pergudangan, dan transaksi digital dengan fitur zoom lightbox dan petunjuk huruf.',
      icon: ImageIcon,
      badge: 'Literasi Visual',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      color: 'from-amber-600 to-amber-500'
    },
    {
      id: 'speed',
      title: 'Kuis Cepat (10 Detik)',
      code: 'KCM-5K9Z3',
      description: 'Tantangan kilat berpacu melawan hitung mundur 10 detik per soal dengan pengganda skor kecepatan dan reflek kognitif.',
      icon: Zap,
      badge: 'Adrenalin Tinggi',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      color: 'from-rose-600 to-rose-500'
    },
    {
      id: 'competition',
      title: 'Kompetisi Live Room',
      code: 'KCM-ROOM-9A',
      description: 'Duel kuis langsung satu kelas dalam ruang kompetisi online dengan sinkronisasi waktu nyata dan papan juara podium.',
      icon: Trophy,
      badge: 'Multiplayer Live',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      color: 'from-purple-700 to-purple-600'
    }
  ];

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          {/* Madrasah Academic Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            <span>MADRASAH TSANAWIYAH NEGERI 5 TEGAL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
            KUIS CERDAS <span className="text-emerald-700">MATSAMAGA</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Platform asesmen formatif & sumatif interaktif madrasah berbasis game-based learning. Menguatkan nalar kognitif, budi pekerti luhur, dan prestasi peserta didik.
          </p>

          <p className="text-xs sm:text-sm font-semibold text-emerald-800 italic">
            "Belajar, Bermain, Berpikir, dan Berprestasi."
          </p>

          {/* Direct PIN Input Card (High Density) */}
          <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4 shadow-xs border border-gray-200 mt-4">
            <form onSubmit={handleJoinByPin} className="space-y-2.5">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider text-left">
                Punya Kode Kuis dari Guru?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: KCM-9A7X2"
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-600 focus:outline-hidden font-mono font-bold text-sm tracking-wider text-gray-900 uppercase bg-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>Gabung</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-left">
                Masukkan 9 digit kode kuis untuk langsung masuk ke arena asesmen interaktif.
              </p>
            </form>
          </div>

          {/* Distinct Role Portals & Login Pathways */}
          <div className="pt-3 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Pemisahan Hak Akses Resmi Madrasah:
                </p>
                <p className="text-xs font-bold text-gray-800">
                  Portal Siswa, Dewan Guru & Administrator
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('login')}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Buka Portal Login & RBAC</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Game Modes Showcase Grid (High Density) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1.5 max-w-3xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            6 Pilihan Mode Permainan Edukatif
          </span>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Pembelajaran Interaktif yang Menyenangkan
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Pilih mode kuis sesuai tujuan asesmen formatif, sumatif, remedial, maupun pengayaan di MTsN 5 Tegal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameModes.map(mode => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-emerald-400 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#065F46] text-white flex items-center justify-center shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs flex items-center justify-between">
                    <span className="text-gray-400 font-medium text-[11px]">Demo Kode:</span>
                    <span className="font-mono font-bold text-gray-800 text-xs">{mode.code}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => playDemoGame(mode.code)}
                    className="w-full py-2 px-3 rounded-lg bg-[#065F46] hover:bg-[#044e3a] active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Coba Mainkan Sekarang</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Madrasah Values & Curriculum Integration Section (High Density Dark Theme) */}
      <section className="bg-[#0F172A] text-white py-12 px-4 sm:px-6 lg:px-8 rounded-xl max-w-7xl mx-auto shadow-xl space-y-8 border border-gray-800">
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-[11px] font-semibold">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            <span>Harmoni Kurikulum Madrasah</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Kurikulum Berbasis Cinta (KBC) & Dimensi Profil Lulusan
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Setiap butir soal di platform KCM dipetakan secara terukur ke dalam nilai cinta madrasah dan kecakapan lulusan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KBC Pillar */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              5 Nilai Kurikulum Berbasis Cinta (KBC)
            </h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><b className="text-white">Cinta Allah SWT & Rasulullah:</b> Menumbuhkan keimanan, ketakwaan, dan syukur atas nikmat ilmu.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><b className="text-white">Cinta Diri dan Sesama:</b> Menjunjung integritas, empati, anti-menyontek, dan persaudaraan islami.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><b className="text-white">Cinta Ilmu:</b> Semangat pantang menyerah dalam eksplorasi pengetahuan dan berpikir kritis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><b className="text-white">Cinta Lingkungan:</b> Menjaga kelestarian alam ciptaan Allah dan gaya hidup bersahaja.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><b className="text-white">Cinta Tanah Air:</b> Bangga pada produk bangsa dan berkontribusi untuk kemajuan Indonesia.</span>
              </li>
            </ul>
          </div>

          {/* Profil Lulusan Pillar */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              8 Dimensi Profil Lulusan
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">1. Keimanan & Ketakwaan</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Akhlak mulia dan ibadah</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">2. Kewargaan</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Demokratis & cinta NKRI</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">3. Penalaran Kritis</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Analisis nalar Bloom C1-C6</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">4. Kreativitas</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Gagasan orisinal inovatif</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">5. Kolaborasi</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Gotong royong & kerja tim</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">6. Kemandirian</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Tanggung jawab mandiri</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">7. Kesehatan</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Kebugaran jasmani-rohani</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50">
                <b className="text-white text-[11px]">8. Komunikasi</b>
                <p className="text-[10px] text-gray-400 mt-0.5">Penyampaian ide santun</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

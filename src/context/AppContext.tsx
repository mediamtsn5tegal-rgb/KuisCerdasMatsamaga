import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Quiz, Question, UserRole, RolePermissionInfo, RoleFeatureAccess } from '../types';
import { soundManager } from '../services/audioEffects';

export type PageView = 
  | 'landing' 
  | 'login'
  | 'join' 
  | 'admin_dashboard' 
  | 'guru_dashboard' 
  | 'student_dashboard' 
  | 'ai_generator' 
  | 'quiz_builder' 
  | 'question_bank' 
  | 'play'
  | 'gameplay' 
  | 'result' 
  | 'analytics' 
  | 'leaderboard';

export const ROLE_DETAILS: Record<UserRole, RolePermissionInfo> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'Administrator Madrasah',
    badgeLabel: 'ADMINISTRATOR',
    badgeClass: 'bg-purple-700 text-white border-purple-500',
    portalDescription: 'Hak Akses Penuh: Kelola Data Master Madrasah, Akun Siswa & Guru, Rekapitulasi Nilai Seluruh Kelas, Konfigurasi Sistem & Audit Log.',
    targetDashboard: 'admin_dashboard',
    allowedSummary: [
      'Kelola Data Master Kelas & Rombel (Tambah, Edit, Hapus, Impor)',
      'Kelola Data Siswa & Pengelompokan Kelas',
      'Kelola Data Dewan Guru & Penetapan Pengembang',
      'Unduh & Rekap Nilai Siswa Semua Kelas (CSV/Excel)',
      'Konfigurasi Madrasah & Pengaturan Standar KKTP',
      'Pemantauan Log Aktivitas Sistem (Audit Log)'
    ],
    restrictedSummary: []
  },
  GURU: {
    role: 'GURU',
    title: 'Guru / Pendidik Mata Pelajaran',
    badgeLabel: 'DEWAN GURU',
    badgeClass: 'bg-emerald-700 text-white border-emerald-500',
    portalDescription: 'Hak Akses Pendidik: Pembuatan Kuis 6 Mode Game, AI Generator Soal C1-C6, Bank Soal, Pemantauan Hasil Asesmen Kelas, dan Unduh Rekap Nilai.',
    targetDashboard: 'guru_dashboard',
    allowedSummary: [
      'Buat & Edit Kuis Interaktif (TTS, Word Search, PG, Tebak Gambar, Kuis Cepat, Kompetisi)',
      'AI Generator Soal Otomatis (Taksonomi Bloom C1-C6 & Nilai KBC)',
      'Bank Soal Terstandar Madrasah & Pembahasan',
      'Mulai Sesi Live Room Kompetisi Kelas',
      'Analisis Butir Soal, Daya Serap & Tingkat Kesukaran',
      'Unduh Rekap Nilai Siswa Kelas yang Diampu'
    ],
    restrictedSummary: [
      'Tidak dapat menghapus akun pendidik lain',
      'Tidak dapat mereset konfigurasi sistem madrasah'
    ]
  },
  SISWA: {
    role: 'SISWA',
    title: 'Peserta Didik (Siswa)',
    badgeLabel: 'PESERTA DIDIK',
    badgeClass: 'bg-blue-600 text-white border-blue-400',
    portalDescription: 'Hak Akses Siswa: Bergabung & Memainkan Kuis Edukasi, Memeriksa Capaian Nilai Pribadi, Bintang Prestasi, dan Papan Peringkat.',
    targetDashboard: 'student_dashboard',
    allowedSummary: [
      'Gabung Kuis menggunakan Kode PIN atau Mode Game',
      'Kerjakan Asesmen dengan Evaluasi & Pembahasan Instan',
      'Dashboard Capaian Pribadi, Rekor Skor & Bintang Prestasi',
      'Papan Peringkat (Leaderboard) Kelas & Madrasah'
    ],
    restrictedSummary: [
      'Dilarang membuat / mengedit kuis dan melihat kunci jawaban guru',
      'Dilarang mengakses AI Generator dan Bank Soal Madrasah',
      'Dilarang mengakses Panel Administrasi Master Data Madrasah',
      'Dilarang mengubah atau menghapus data pengguna lain'
    ]
  }
};

export const FEATURE_ACCESS_MATRIX: RoleFeatureAccess[] = [
  {
    feature: 'Mengerjakan 6 Mode Kuis Interaktif (TTS, Word Search, PG, dll)',
    category: 'Asesmen & Game',
    admin: true,
    guru: true,
    siswa: true,
    notes: 'Siswa dapat mengerjakan dan melihat hasil evaluasi instan'
  },
  {
    feature: 'Masuk Ruang Kompetisi Live Room',
    category: 'Asesmen & Game',
    admin: true,
    guru: true,
    siswa: true,
    notes: 'Siswa sebagai pemain peserta; Guru/Admin sebagai pemandu/tuan rumah'
  },
  {
    feature: 'Papan Peringkat (Leaderboard) Madrasah',
    category: 'Asesmen & Game',
    admin: true,
    guru: true,
    siswa: true,
    notes: 'Terbuka untuk memotivasi iklim belajar sehat'
  },
  {
    feature: 'Dashboard Capaian Nilai & Bintang Siswa Pribadi',
    category: 'Asesmen & Game',
    admin: true,
    guru: true,
    siswa: true,
    notes: 'Siswa melihat capaian diri sendiri; Guru/Admin melihat seluruh kelas'
  },
  {
    feature: 'Buat & Rancang Kuis Baru (Wizard 4 Langkah)',
    category: 'Asesmen & Game',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Hak khusus Guru & Admin'
  },
  {
    feature: 'AI Quiz & Soal Generator (Gemini AI C1-C6 & KBC)',
    category: 'Bank Soal & AI',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Hak khusus Guru & Admin'
  },
  {
    feature: 'Bank Soal Terstandar Madrasah (Lihat Kunci & Pembahasan)',
    category: 'Bank Soal & AI',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Hak khusus Guru & Admin'
  },
  {
    feature: 'Analisis Butir Soal, Tingkat Kesukaran & Daya Serap',
    category: 'Laporan & Nilai',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Evaluasi formatif & diagnostik guru'
  },
  {
    feature: 'Unduh Rekapitulasi Nilai Siswa (Format Excel / CSV UTF-8)',
    category: 'Laporan & Nilai',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Digunakan untuk pelaporan nilai rapor & wali kelas'
  },
  {
    feature: 'Cetak Lembar Asesmen / LKPD Teka-Teki Silang',
    category: 'Asesmen & Game',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Bahan cetak asesmen luring tatap muka'
  },
  {
    feature: 'Kelola Data Rombel / Kelas (Tambah, Edit, Hapus, Impor)',
    category: 'Manajemen Data Madrasah',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Guru dapat kelola kelas binaan; Admin memegang kontrol master'
  },
  {
    feature: 'Kelola Data Siswa (CRUD, Filter Kelas, Impor CSV)',
    category: 'Manajemen Data Madrasah',
    admin: true,
    guru: true,
    siswa: false,
    notes: 'Guru dapat kelola siswa kelas binaan; Admin memegang kontrol master'
  },
  {
    feature: 'Kelola Akun Guru & Tenaga Pendidik',
    category: 'Manajemen Data Madrasah',
    admin: true,
    guru: false,
    siswa: false,
    notes: 'Eksklusif Administrator Madrasah'
  },
  {
    feature: 'Konfigurasi Identitas Madrasah & Standar KKTP Sistem',
    category: 'Pengaturan Sistem',
    admin: true,
    guru: false,
    siswa: false,
    notes: 'Eksklusif Administrator Madrasah'
  },
  {
    feature: 'Audit Log & Riwayat Aktivitas Keamanan Sistem',
    category: 'Pengaturan Sistem',
    admin: true,
    guru: false,
    siswa: false,
    notes: 'Eksklusif Administrator Madrasah'
  }
];

export const isPageAllowedForRole = (page: PageView, role: UserRole): boolean => {
  switch (page) {
    case 'landing':
    case 'login':
    case 'join':
    case 'student_dashboard':
    case 'leaderboard':
    case 'play':
    case 'gameplay':
    case 'result':
      return true;
    case 'guru_dashboard':
    case 'quiz_builder':
    case 'question_bank':
    case 'ai_generator':
    case 'analytics':
      return role === 'ADMIN' || role === 'GURU';
    case 'admin_dashboard':
      // Admin has full access, Guru can access class/student/grades section
      return role === 'ADMIN' || role === 'GURU';
    default:
      return true;
  }
};

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  activeQuizCode: string;
  setActiveQuizCode: (code: string) => void;
  activeResultId: string;
  setActiveResultId: (id: string) => void;
  activeAnalyticsQuizId: string;
  setActiveAnalyticsQuizId: (id: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  allUsers: User[];
  switchDemoRole: (role: 'ADMIN' | 'GURU' | 'SISWA') => void;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  canAccessCurrentPage: () => boolean;
}

const DEFAULT_USER: User = {
  id: 'u_guru_1',
  name: 'Supro, S.Pd.',
  nip: '198205122009011012',
  email: 'supro@matsamaga.sch.id',
  role: 'GURU',
  subject: 'IPS',
  phone: '081234567890',
  isDeveloper: true,
  createdAt: new Date().toISOString()
};

const INITIAL_FALLBACK_USERS: User[] = [
  DEFAULT_USER,
  {
    id: 'u_admin_1',
    name: 'Administrator MTsN 5 Tegal',
    email: 'admin@matsamaga.sch.id',
    role: 'ADMIN',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u_siswa_1',
    name: 'Muhammad Raihan',
    nis: '21220901',
    email: 'raihan@matsamaga.sch.id',
    role: 'SISWA',
    classId: 'c_9a',
    studentClass: 'IX A',
    gender: 'L',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u_siswa_2',
    name: 'Siti Fatimah',
    nis: '21220902',
    email: 'fatimah@matsamaga.sch.id',
    role: 'SISWA',
    classId: 'c_9a',
    studentClass: 'IX A',
    gender: 'P',
    createdAt: new Date().toISOString()
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('kcm_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  const [currentPage, setCurrentPage] = useState<PageView>('login');
  const [activeQuizCode, setActiveQuizCode] = useState<string>('KCM-9A7X2');
  const [activeResultId, setActiveResultId] = useState<string>('');
  const [activeAnalyticsQuizId, setActiveAnalyticsQuizId] = useState<string>('quiz_tts_demo');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_FALLBACK_USERS);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllUsers(data);
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  // Persist currentUser to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kcm_current_user', JSON.stringify(currentUser));
    } catch {
      // ignore
    }
  }, [currentUser]);

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
    showToast(`Suara permainan ${newState ? 'Aktif' : 'Dinonaktifkan'}`, 'info');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const loginUser = (user: User) => {
    setCurrentUser(user);
    soundManager.playSuccess();
    showToast(`Selamat datang, ${user.name}! Masuk sebagai ${ROLE_DETAILS[user.role]?.title || user.role}`, 'success');

    // Auto-navigate to respective dashboard
    if (user.role === 'ADMIN') {
      setCurrentPage('admin_dashboard');
    } else if (user.role === 'GURU') {
      setCurrentPage('guru_dashboard');
    } else {
      setCurrentPage('student_dashboard');
    }
  };

  const logoutUser = () => {
    soundManager.playClick();
    showToast('Anda telah keluar dari akun.', 'info');
    setCurrentPage('login');
  };

  const switchDemoRole = (role: 'ADMIN' | 'GURU' | 'SISWA') => {
    const target = allUsers.find(u => u.role === role);
    if (target) {
      loginUser(target);
    } else {
      // Fallback
      if (role === 'ADMIN') {
        loginUser({
          id: 'u_admin_1',
          name: 'Administrator MTsN 5 Tegal',
          email: 'admin@matsamaga.sch.id',
          role: 'ADMIN',
          createdAt: new Date().toISOString()
        });
      } else if (role === 'GURU') {
        loginUser(DEFAULT_USER);
      } else {
        loginUser({
          id: 'u_siswa_1',
          name: 'Muhammad Raihan',
          nis: '21220901',
          studentClass: 'IX A',
          email: 'raihan@matsamaga.sch.id',
          role: 'SISWA',
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  const canAccessCurrentPage = () => {
    return isPageAllowedForRole(currentPage, currentUser.role);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentPage,
        setCurrentPage,
        activeQuizCode,
        setActiveQuizCode,
        activeResultId,
        setActiveResultId,
        activeAnalyticsQuizId,
        setActiveAnalyticsQuizId,
        soundEnabled,
        toggleSound,
        toasts,
        showToast,
        removeToast,
        refreshKey,
        triggerRefresh,
        allUsers,
        switchDemoRole,
        loginUser,
        logoutUser,
        canAccessCurrentPage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


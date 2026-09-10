import React from 'react';
import { useApp, ROLE_DETAILS } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, LogIn, Lock, GraduationCap, CheckCircle } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole?: 'GURU' | 'ADMIN';
  pageTitle?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole = 'GURU',
  pageTitle = 'Halaman Terproteksi'
}) => {
  const { currentUser, setCurrentPage } = useApp();

  const currentRoleInfo = ROLE_DETAILS[currentUser.role];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-rose-200 shadow-md p-6 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Hak Akses Terbatas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Akses Dibatasi untuk Peran Anda
          </h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Halaman <span className="font-bold text-gray-900">"{pageTitle}"</span> memerlukan hak akses khusus{' '}
            <span className="font-bold text-rose-700">
              {requiredRole === 'ADMIN' ? 'Administrator Madrasah' : 'Dewan Guru atau Administrator'}
            </span>.
          </p>
        </div>

        {/* Current User Card */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-w-md mx-auto text-left flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Akun Masuk Saat Ini:</p>
            <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
            <p className="text-xs text-gray-500">
              {currentUser.role === 'SISWA'
                ? `NIS: ${currentUser.nis || '-'} • Kelas ${currentUser.studentClass || 'IX A'}`
                : currentUser.role === 'GURU'
                ? `NIP: ${currentUser.nip || '-'} • Mapel ${currentUser.subject || 'IPS'}`
                : currentUser.email}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-xs ${currentRoleInfo?.badgeClass || 'bg-gray-600 text-white'}`}>
            {currentRoleInfo?.badgeLabel || currentUser.role}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              if (currentUser.role === 'SISWA') setCurrentPage('student_dashboard');
              else if (currentUser.role === 'GURU') setCurrentPage('guru_dashboard');
              else setCurrentPage('admin_dashboard');
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Dashboard Saya</span>
          </button>

          <button
            onClick={() => setCurrentPage('login')}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <LogIn className="w-4 h-4 text-emerald-700" />
            <span>Ganti Akun / Portal Login</span>
          </button>

          {currentUser.role === 'SISWA' && (
            <button
              onClick={() => setCurrentPage('join')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Mulai Kerjakan Kuis</span>
            </button>
          )}
        </div>

        {/* Information box */}
        <div className="text-left bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-xs text-gray-600 space-y-2 max-w-xl mx-auto">
          <p className="font-bold text-emerald-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Mengapa hak akses ini dibatasi?</span>
          </p>
          <p className="text-[11px] leading-relaxed text-gray-600">
            KUIS CERDAS MATSAMAGA memisahkan hak akses untuk menjamin kerahasiaan bank soal, integritas nilai asesmen, serta kepatuhan data pribadi madrasah sesuai regulasi Kurikulum Merdeka.
          </p>
        </div>
      </div>
    </div>
  );
};

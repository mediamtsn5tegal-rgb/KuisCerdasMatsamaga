import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  LogOut,
  AlertCircle,
  Database,
  CloudCheck,
  Sparkles,
  Link2,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Info
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  initAuth
} from '../../services/googleAuthService';
import {
  createMadrasahSpreadsheet,
  syncAllDataToGoogleSheets,
  importDataFromGoogleSheets,
  twoWaySyncWithGoogleSheets
} from '../../services/googleSheetsService';
import { useApp } from '../../context/AppContext';

interface Props {
  compact?: boolean;
  onSuccess?: () => void;
}

type SyncActionType = 'TWO_WAY' | 'PUSH' | 'PULL' | 'CLEAR_DEMO';

export const GoogleSheetsSyncCard: React.FC<Props> = ({ compact = false, onSuccess }) => {
  const { showToast, triggerRefresh } = useApp();
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [customInputId, setCustomInputId] = useState('');
  const [showInputCustom, setShowInputCustom] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<SyncActionType>('TWO_WAY');
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);

  // Load saved spreadsheet settings on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => (r.ok ? r.json() : null))
      .then(settings => {
        if (settings?.googleSpreadsheetId) {
          setSpreadsheetId(settings.googleSpreadsheetId);
          setSpreadsheetUrl(
            settings.googleSpreadsheetUrl ||
              `https://docs.google.com/spreadsheets/d/${settings.googleSpreadsheetId}/edit`
          );
        }
        if (settings?.lastSpreadsheetSync) {
          setLastSync(settings.lastSpreadsheetSync);
        }
      })
      .catch(() => {});

    // Init Google Auth listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        showToast('Berhasil terhubung dengan Akun Google!', 'success');
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const msg = err.message || '';
      if (
        msg.includes('verification') ||
        msg.includes('test') ||
        msg.includes('access_denied') ||
        msg.includes('403') ||
        msg.includes('unverified')
      ) {
        setShowVerificationHelp(true);
        showToast(
          'Akun ini belum didaftarkan sebagai Penguji (Test User) di Google Cloud Console. Silakan baca panduan di bawah.',
          'error'
        );
      } else {
        showToast(msg || 'Gagal masuk dengan Google.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      showToast('Koneksi Google diputus.', 'info');
    } catch {
      showToast('Gagal logout Google.', 'error');
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!accessToken) {
      showToast('Silakan Masuk dengan Google terlebih dahulu.', 'error');
      return;
    }

    setLoading(true);
    try {
      const created = await createMadrasahSpreadsheet(accessToken, 'MTsN 5 Tegal');
      setSpreadsheetId(created.spreadsheetId);
      setSpreadsheetUrl(created.spreadsheetUrl);

      // Save to backend system settings
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleSpreadsheetId: created.spreadsheetId,
          googleSpreadsheetUrl: created.spreadsheetUrl,
          lastSpreadsheetSync: new Date().toISOString()
        })
      });

      showToast('Google Spreadsheet MTsN 5 Tegal berhasil dibuat!', 'success');

      // Auto sync all current data into the newly created sheet
      setSyncing(true);
      await syncAllDataToGoogleSheets(accessToken, created.spreadsheetId);
      setLastSync(new Date().toISOString());
      showToast('Semua data dan hasil asesmen berhasil disinkronkan ke Spreadsheet!', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal membuat Google Spreadsheet.', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSaveCustomId = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanedId = customInputId.trim();
    // Extract ID if full URL pasted
    if (cleanedId.includes('/d/')) {
      const match = cleanedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) cleanedId = match[1];
    }

    if (!cleanedId) {
      showToast('Masukkan ID atau URL Google Spreadsheet yang valid.', 'error');
      return;
    }

    const targetUrl = `https://docs.google.com/spreadsheets/d/${cleanedId}/edit`;
    setSpreadsheetId(cleanedId);
    setSpreadsheetUrl(targetUrl);
    setShowInputCustom(false);

    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleSpreadsheetId: cleanedId,
        googleSpreadsheetUrl: targetUrl
      })
    });

    showToast('Tautan Spreadsheet berhasil disimpan!', 'success');
  };

  const openActionModal = (action: SyncActionType) => {
    if (action !== 'CLEAR_DEMO' && (!accessToken || !spreadsheetId)) {
      showToast('Harap hubungkan akun Google dan tentukan Spreadsheet terlebih dahulu.', 'error');
      return;
    }
    setSelectedAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    setShowConfirmModal(false);
    setSyncing(true);

    try {
      if (selectedAction === 'TWO_WAY') {
        const res = await twoWaySyncWithGoogleSheets(accessToken!, spreadsheetId);
        setLastSync(new Date().toISOString());
        showToast(res.message, 'success');
        triggerRefresh();
        if (onSuccess) onSuccess();
      } else if (selectedAction === 'PUSH') {
        const res = await syncAllDataToGoogleSheets(accessToken!, spreadsheetId);
        setLastSync(new Date().toISOString());
        showToast(res.message, 'success');
        triggerRefresh();
        if (onSuccess) onSuccess();
      } else if (selectedAction === 'PULL') {
        const res = await importDataFromGoogleSheets(accessToken!, spreadsheetId);
        setLastSync(new Date().toISOString());
        showToast(res.message, 'success');
        triggerRefresh();
        if (onSuccess) onSuccess();
      } else if (selectedAction === 'CLEAR_DEMO') {
        const res = await fetch('/api/admin/clear-demo-results', { method: 'POST' });
        const d = await res.json();
        showToast(d.message || 'Hasil demo berhasil dibersihkan!', 'success');
        triggerRefresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Terjadi kesalahan saat memproses data.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      id="google-sheets-integration-card"
      className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs overflow-hidden"
    >
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base tracking-tight">
                Integrasi Otomatis Google Spreadsheet
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                Google Sheets API v4
              </span>
            </div>
            <p className="text-xs text-emerald-100/80">
              Menyimpan seluruh input data madrasah (kelas, siswa, guru, soal) serta rekap respon asesmen siswa secara langsung.
            </p>
          </div>
        </div>

        {/* Auth Status / Google Sign In */}
        <div className="shrink-0 flex items-center gap-2">
          {googleUser ? (
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-xs">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google'}
                  className="w-5 h-5 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {googleUser.displayName?.[0] || 'G'}
                </div>
              )}
              <span className="font-semibold text-emerald-100 max-w-[140px] truncate">
                {googleUser.displayName || googleUser.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-emerald-300 hover:text-white ml-1 p-1 hover:bg-white/10 rounded"
                title="Putuskan sambungan Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="flex items-center gap-2 bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all border border-gray-200 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-5">
        {/* Spreadsheet Link or Create Action */}
        {spreadsheetId ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  Spreadsheet Aktif:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {spreadsheetId.substring(0, 16)}...
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                [MTsN 5 Tegal] Database Asesmen & Nilai Kuis Cerdas Matsamaga
              </p>
              {lastSync && (
                <p className="text-[11px] text-emerald-700/80">
                  Sinkronisasi terakhir: {new Date(lastSync).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Buka Google Sheets</span>
              </a>

              {/* Two-Way Sync (Primary) */}
              <button
                onClick={() => openActionModal('TWO_WAY')}
                disabled={syncing || !accessToken}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                title="Sinkronisasi Dua Arah: Tarik perubahan dari Spreadsheet lalu perbarui rekapan hasil asesmen"
              >
                <ArrowLeftRight className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Menyinkronkan...' : 'Sinkronisasi 2 Arah'}</span>
              </button>

              {/* Push to Sheets */}
              <button
                onClick={() => openActionModal('PUSH')}
                disabled={syncing || !accessToken}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="Kirim semua data lokal & hasil evaluasi siswa ke Google Spreadsheet"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim Data</span>
              </button>

              {/* Pull from Sheets */}
              <button
                onClick={() => openActionModal('PULL')}
                disabled={syncing || !accessToken}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="Tarik data siswa, kelas, guru, dan bank soal yang diedit di Google Spreadsheet"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-teal-600" />
                <span>Tarik Data</span>
              </button>

              {/* Clear Demo Results */}
              <button
                onClick={() => openActionModal('CLEAR_DEMO')}
                disabled={syncing}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                title="Bersihkan riwayat asesmen demo agar aplikasi bersih siap pakai untuk ujian nyata"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Bersihkan Demo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Belum Ada Google Spreadsheet Terhubung
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Buat Google Spreadsheet baru secara otomatis dengan seluruh sheet terstruktur (Nilai Siswa, Detail Respon, Data Kelas, Data Siswa, Guru, dan Bank Soal).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCreateNewSpreadsheet}
                disabled={loading || !accessToken}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Spreadsheet MTsN 5 Tegal Otomatis</span>
              </button>

              <button
                onClick={() => setShowInputCustom(!showInputCustom)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                <span>Gunakan Spreadsheet yang Sudah Ada</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Custom Spreadsheet ID Form */}
        {showInputCustom && (
          <form
            onSubmit={handleSaveCustomId}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs"
          >
            <label className="font-bold text-slate-700 block">
              Masukkan ID atau Tautan Lengkap Google Spreadsheet:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInputId}
                onChange={e => setCustomInputId(e.target.value)}
                placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau tautan URL"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Hubungkan
              </button>
            </div>
          </form>
        )}

        {/* Two-way explanation banner */}
        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Mendukung Sinkronisasi Dua Arah (Two-Way Sync):</span>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              1. <b>Aplikasi → Spreadsheet</b>: Setiap siswa selesai kuis otomatis dicatat, atau klik <b>Kirim Data</b> untuk menyinkronkan seluruh database.<br />
              2. <b>Spreadsheet → Aplikasi</b>: Tambahkan atau ubah data siswa, rombel kelas, atau bank soal di Google Spreadsheet, lalu klik <b>Tarik Data</b> untuk memperbarui database aplikasi secara instan.
            </p>
          </div>
        </div>

        {/* Notice for Google Verification / Test User warning */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold">
                Muncul pesan: <i>"Aplikasi sedang diuji dan hanya dapat diakses oleh penguji yang disetujui developer"</i>?
              </span>
            </div>
            <button
              onClick={() => setShowVerificationHelp(!showVerificationHelp)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0 ml-2"
            >
              {showVerificationHelp ? 'Tutup Panduan' : 'Lihat Solusi'}
            </button>
          </div>

          {showVerificationHelp && (
            <div className="pt-2 border-t border-amber-200/60 space-y-2 text-[11px] text-amber-950 leading-relaxed">
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                <b className="text-amber-900 block mb-1">
                  💡 Solusi 1 (Paling Direkomendasikan - Bebas Ribet):
                </b>
                <p>
                  <b>Siswa & Dewan Guru Lain TIDAK PERLU menghubungkan akun Google!</b> Cukup 1 akun pengembang/madrasah (<b>mediamtsntegal@gmail.com</b>) yang menghubungkan Spreadsheet. Begitu terhubung, seluruh siswa yang mengerjakan kuis di perangkat manapun akan otomatis tercatat nilainya tanpa perlu login Google sama sekali.
                </p>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 space-y-1">
                <b className="text-amber-900 block mb-1">
                  🛠️ Solusi 2 (Jika akun lain tetap ingin menghubungkan ke Google Spreadsheet):
                </b>
                <p>
                  Pesan tersebut muncul karena Google Cloud Console secara otomatis menempatkan status perizinan OAuth dalam mode <b>"Testing"</b> (Pengujian). Anda dapat mengizinkannya dengan 2 cara:
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    <b>Tambahkan Email Sebagai Penguji (Test Users)</b>: Buka <i>console.cloud.google.com</i> &gt; pilih project <code>gen-lang-client-0622795059</code> &gt; menu <b>APIs & Services</b> &gt; <b>OAuth consent screen</b> &gt; scroll ke <b>Test users</b> &gt; klik <b>+ ADD USERS</b> &gt; masukkan email akun lain tersebut &gt; klik <b>Save</b>.
                  </li>
                  <li>
                    <b>Publikasikan OAuth (Publish App)</b>: Di halaman <i>OAuth consent screen</i> yang sama, klik tombol <b>"PUBLISH APP"</b> agar dapat diakses oleh semua akun Google.
                  </li>
                </ol>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-950">
                <b className="text-emerald-900 block mb-0.5">
                  ✅ Cara Melewati Layar "Google belum memverifikasi aplikasi ini":
                </b>
                <p>
                  Saat popup Google muncul, klik tulisan kecil <b>"Lanjutan" (Advanced)</b> di kiri bawah &gt; klik <b>"Buka gen-lang-client-0622795059.firebaseapp.com (tidak aman)"</b> &gt; klik <b>Lanjutkan</b> &gt; Berikan centang izin Google Sheets &gt; Selesai.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sheets Structure Explanation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
              Tab 1 & 2
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">Hasil & Respon Siswa</p>
            <p className="text-[11px] text-slate-500">
              Rekapitulasi nilai akhir, predikat kelulusan KKTP, beserta rincian tiap butir respon soal.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
              Tab 3 & 4
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">Master Kelas & Siswa</p>
            <p className="text-[11px] text-slate-500">
              Daftar rombel kelas, wali kelas, serta basis data peserta didik lengkap dengan NIS.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
              Tab 5 & 6
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">Dewan Guru & Bank Soal</p>
            <p className="text-[11px] text-slate-500">
              Data dewan guru, profil pengembang (Supro, S.Pd.), serta arsip butir soal Kurikulum Merdeka.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Mutating Action (Mandatory per Workspace Integration Skill) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800 pb-2 border-b border-slate-100">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-base">
                {selectedAction === 'TWO_WAY' && 'Konfirmasi Sinkronisasi Dua Arah'}
                {selectedAction === 'PUSH' && 'Konfirmasi Kirim Data ke Spreadsheet'}
                {selectedAction === 'PULL' && 'Konfirmasi Tarik Data dari Spreadsheet'}
                {selectedAction === 'CLEAR_DEMO' && 'Bersihkan Hasil Asesmen Demo'}
              </h3>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              {selectedAction === 'TWO_WAY' && (
                <>
                  <p>
                    Tindakan ini akan melakukan <b>sinkronisasi dua arah</b>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Menarik baris kelas, siswa, guru, dan bank soal yang ada di Google Spreadsheet.</li>
                    <li>Mengirimkan seluruh rekaman nilai dan respon jawaban terbaru ke Google Spreadsheet.</li>
                  </ul>
                </>
              )}

              {selectedAction === 'PUSH' && (
                <p>
                  Mengirimkan seluruh data aktif madrasah (daftar kelas, peserta didik, dewan guru, butir bank soal) serta seluruh riwayat nilai asesmen siswa ke spreadsheet:
                  <b className="text-slate-800 block mt-1 font-mono text-[11px]">
                    ID: {spreadsheetId}
                  </b>
                </p>
              )}

              {selectedAction === 'PULL' && (
                <p>
                  Membaca tab <b>Master_Kelas</b>, <b>Master_Siswa</b>, <b>Master_Guru</b>, dan <b>Master_Bank_Soal</b> dari Google Spreadsheet, kemudian memperbarui database aplikasi secara langsung.
                </p>
              )}

              {selectedAction === 'CLEAR_DEMO' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <p className="font-bold">Perhatian Persiapan Data Riil:</p>
                  <p>
                    Tindakan ini akan mengosongkan riwayat asesmen dan nilai demo uji coba, sehingga nilai kuis siswa dimulai bersih dari nol (0) untuk pelaksanaan asesmen resmi madrasah. Master data kelas, guru, dan soal tetap utuh.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={executeAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  selectedAction === 'CLEAR_DEMO'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {selectedAction === 'CLEAR_DEMO' ? 'Bersihkan Hasil Demo' : 'Lanjutkan Proses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

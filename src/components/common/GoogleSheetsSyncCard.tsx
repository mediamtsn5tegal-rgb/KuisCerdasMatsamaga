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
  Info,
  Copy,
  Check,
  Code,
  ShieldAlert,
  Wrench,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings
} from 'lucide-react';
import {
  AppGoogleUser,
  GoogleAuthErrorInfo,
  parseGoogleAuthError,
  googleSignIn,
  signInWithGsi,
  logoutGoogle,
  getAccessToken,
  initAuth
} from '../../services/googleAuthService';
import {
  createMadrasahSpreadsheet,
  syncAllDataToGoogleSheets,
  importDataFromGoogleSheets,
  twoWaySyncWithGoogleSheets,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  syncToAppsScriptWebapp
} from '../../services/googleSheetsService';
import { useApp } from '../../context/AppContext';

interface Props {
  compact?: boolean;
  onSuccess?: () => void;
  initialTab?: 'SHEETS_API' | 'APPS_SCRIPT';
}

type SyncActionType = 'TWO_WAY' | 'PUSH' | 'PULL' | 'CLEAR_DEMO';

export const GoogleSheetsSyncCard: React.FC<Props> = ({
  compact = false,
  onSuccess,
  initialTab = 'APPS_SCRIPT'
}) => {
  const { showToast, triggerRefresh } = useApp();
  const [googleUser, setGoogleUser] = useState<AppGoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [customInputId, setCustomInputId] = useState('');
  const [showInputCustom, setShowInputCustom] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<SyncActionType>('TWO_WAY');
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);

  // New diagnostic & alternative connection states
  const [activeTab, setActiveTab] = useState<'SHEETS_API' | 'APPS_SCRIPT'>(initialTab);
  const [errorModalInfo, setErrorModalInfo] = useState<GoogleAuthErrorInfo | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [inputAppsScriptUrl, setInputAppsScriptUrl] = useState('');
  const [savingAppsScript, setSavingAppsScript] = useState(false);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(true);

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
        if (settings?.googleAppsScriptUrl) {
          setAppsScriptUrl(settings.googleAppsScriptUrl);
          setInputAppsScriptUrl(settings.googleAppsScriptUrl);
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

  const handleSignIn = async (preferGsi = false) => {
    setShowLoginDropdown(false);
    setLoading(true);
    try {
      const result = await googleSignIn(preferGsi);
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        showToast('Berhasil terhubung dengan Akun Google!', 'success');
        setErrorModalInfo(null);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const parsed = parseGoogleAuthError(err);
      setErrorModalInfo(parsed);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInGsiDirect = async () => {
    setShowLoginDropdown(false);
    setLoading(true);
    try {
      const result = await signInWithGsi();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        showToast('Berhasil terhubung via Google Identity Services (GSI)!', 'success');
        setErrorModalInfo(null);
      }
    } catch (err: any) {
      console.error('GSI direct error:', err);
      const parsed = parseGoogleAuthError(err);
      setErrorModalInfo(parsed);
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
      // Prompt user to sign in
      handleSignIn();
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
      console.error('Create Spreadsheet Error:', err);
      const parsed = parseGoogleAuthError(err);
      setErrorModalInfo(parsed);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSaveCustomId = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanedId = customInputId.trim();
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

  const handleSaveAppsScriptUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputAppsScriptUrl.trim();
    if (!url.startsWith('https://script.google.com/macros/s/')) {
      showToast('URL Google Apps Script harus berawalan "https://script.google.com/macros/s/..."', 'error');
      return;
    }

    setSavingAppsScript(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleAppsScriptUrl: url
        })
      });
      setAppsScriptUrl(url);
      showToast('URL Google Apps Script berhasil disimpan dan terhubung!', 'success');
    } catch {
      showToast('Gagal menyimpan URL Apps Script.', 'error');
    } finally {
      setSavingAppsScript(false);
    }
  };

  const handleCopyCurrentDomain = () => {
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    navigator.clipboard.writeText(domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
    showToast(`Domain "${domain}" disalin ke clipboard!`, 'success');
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
    showToast('Skrip Google Apps Script berhasil disalin!', 'success');
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
      const parsed = parseGoogleAuthError(err);
      setErrorModalInfo(parsed);
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
                Multi-Opsi Cloud
              </span>
            </div>
            <p className="text-xs text-emerald-100/80">
              Menyimpan seluruh data madrasah (kelas, siswa, guru, soal) serta rekap nilai asesmen siswa secara otomatis ke Google Sheets.
            </p>
          </div>
        </div>

        {/* Auth Status / Google Sign In */}
        <div className="shrink-0 flex items-center gap-2 relative">
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
                className="text-emerald-300 hover:text-white ml-1 p-1 hover:bg-white/10 rounded cursor-pointer"
                title="Putuskan sambungan Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSignIn(false)}
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

              <button
                onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                className="p-2 bg-emerald-700/60 hover:bg-emerald-700 text-white rounded-xl border border-white/20 transition-all cursor-pointer"
                title="Pilihan Metode Login Google"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showLoginDropdown && (
                <div className="absolute right-0 top-12 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1 animate-in fade-in">
                  <button
                    onClick={() => handleSignIn(false)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-semibold flex items-center justify-between"
                  >
                    <span>Firebase Google Auth (Default)</span>
                  </button>
                  <button
                    onClick={handleSignInGsiDirect}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-800 font-semibold flex items-center justify-between"
                  >
                    <span>Google Identity (GSI Direct)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                      Bypass Domain
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mode Tabs: Sheets API vs Google Apps Script */}
      <div className="bg-slate-100/90 p-2 sm:p-3 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('APPS_SCRIPT')}
            className={`p-3 rounded-xl transition-all cursor-pointer text-left flex items-start gap-3 border ${
              activeTab === 'APPS_SCRIPT'
                ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50/50'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === 'APPS_SCRIPT' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'}`}>
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs">Metode 2: Google Apps Script</span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${activeTab === 'APPS_SCRIPT' ? 'bg-amber-400 text-amber-950' : 'bg-teal-100 text-teal-800'}`}>
                  Rekomendasi
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 leading-snug ${activeTab === 'APPS_SCRIPT' ? 'text-teal-100' : 'text-slate-500'}`}>
                100% Bebas Firebase & OAuth. Salin kode skrip ke Google Sheets lalu simpan URL Web App.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SHEETS_API')}
            className={`p-3 rounded-xl transition-all cursor-pointer text-left flex items-start gap-3 border ${
              activeTab === 'SHEETS_API'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === 'SHEETS_API' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs">Metode 1: Google Sheets API v4</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${activeTab === 'SHEETS_API' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  Login Google
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 leading-snug ${activeTab === 'SHEETS_API' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Login menggunakan akun Google via Firebase/GSI untuk membuat spreadsheet otomatis.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-5">
        {activeTab === 'SHEETS_API' ? (
          <>
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    title="Kirim semua data lokal & hasil evaluasi siswa ke Google Spreadsheet"
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kirim Data</span>
                  </button>

                  {/* Pull from Sheets */}
                  <button
                    onClick={() => openActionModal('PULL')}
                    disabled={syncing || !accessToken}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
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
                    disabled={loading}
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
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
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
                    Pernah muncul pesan peringatan verifikasi atau error Firebase saat menghubungkan?
                  </span>
                </div>
                <button
                  onClick={() => setShowVerificationHelp(!showVerificationHelp)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0 ml-2"
                >
                  {showVerificationHelp ? 'Tutup Panduan' : 'Lihat Solusi Lengkap'}
                </button>
              </div>

              {showVerificationHelp && (
                <div className="pt-2 border-t border-amber-200/60 space-y-2 text-[11px] text-amber-950 leading-relaxed">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
                    <b className="text-amber-900 block mb-1">
                      💡 Solusi 1 (Paling Mudah - Siswa & Guru Bebas Login Google):
                    </b>
                    <p>
                      <b>Siswa & Dewan Guru Lain TIDAK PERLU menghubungkan akun Google!</b> Cukup 1 akun pengembang/madrasah (<b>mediamtsntegal@gmail.com</b>) yang menghubungkan Spreadsheet. Begitu terhubung, seluruh siswa yang mengerjakan kuis di perangkat manapun akan otomatis tercatat nilainya tanpa perlu login Google sama sekali.
                    </p>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 space-y-1">
                    <b className="text-amber-900 block mb-1">
                      🛠️ Solusi 2 (Mengatasi Firebase Error: auth/unauthorized-domain):
                    </b>
                    <p>
                      Jika muncul error Firebase saat klik tombol login, hal ini karena domain aplikasi Anda saat ini belum didaftarkan di Firebase Console.
                    </p>
                    <div className="flex items-center gap-2 py-1">
                      <span className="font-semibold text-slate-700">Domain saat ini:</span>
                      <code className="bg-slate-100 text-slate-900 font-mono px-2 py-0.5 rounded border border-slate-300">
                        {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
                      </code>
                      <button
                        onClick={handleCopyCurrentDomain}
                        className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Tersalin' : 'Salin Domain'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      Buka Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains &gt; Tambahkan domain di atas.
                    </p>
                  </div>

                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-950">
                    <b className="text-emerald-900 block mb-0.5">
                      ✅ Cara Melewati Layar "Google belum memverifikasi aplikasi ini":
                    </b>
                    <p>
                      Saat popup Google muncul, klik tulisan kecil <b>"Lanjutan" (Advanced)</b> di kiri bawah &gt; klik <b>"Buka gen-lang-client-0622795059.firebaseapp.com (tidak aman)"</b> &gt; klik <b>Lanjutkan</b> &gt; Berikan centang izin Google Sheets &gt; Selesai.
                    </p>
                  </div>

                  <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <b className="text-teal-900 block mb-0.5">
                        🚀 Alternatif Termudah (100% Bebas Error Firebase):
                      </b>
                      <p className="text-[11px] text-teal-800">
                        Gunakan skrip Google Apps Script langsung tanpa perlu login Firebase maupun verifikasi Google Cloud.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('APPS_SCRIPT')}
                      className="shrink-0 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Buka Tab Skrip Apps Script</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* TAB 2: GOOGLE APPS SCRIPT INTEGRATION */
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Code className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-teal-950">
                    Integrasi Google Apps Script (Bebas Masalah Firebase & OAuth)
                  </h4>
                  <p className="text-xs text-teal-900/90 leading-relaxed">
                    Metode ini sangat disukai madrasah karena <b>tidak memerlukan pengaturan domain Firebase ataupun verifikasi Google Cloud</b>. Cukup buat Google Spreadsheet kosong, tempelkan skrip di bawah, lalu deploy sebagai Web App!
                  </p>
                </div>
              </div>

              {/* Step by step */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-lg border border-teal-200 space-y-1">
                  <span className="font-bold text-teal-800 block">Langkah 1: Buat Sheet</span>
                  <p className="text-slate-600 text-[11px]">
                    Buka Google Drive Anda, buat spreadsheet baru atau buka{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 font-bold underline inline-flex items-center gap-0.5"
                    >
                      sheets.new <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-teal-200 space-y-1">
                  <span className="font-bold text-teal-800 block">Langkah 2: Pasang Skrip</span>
                  <p className="text-slate-600 text-[11px]">
                    Di Spreadsheet, klik menu <b>Ekstensi &gt; Apps Script</b>. Hapus semua kode bawaan lalu tempel kode skrip di bawah.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-teal-200 space-y-1">
                  <span className="font-bold text-teal-800 block">Langkah 3: Deploy Web App</span>
                  <p className="text-slate-600 text-[11px]">
                    Klik <b>Terapkan &gt; Deployment baru</b> &gt; Pilih <b>Aplikasi Web</b> (Jalankan sebagai: <i>Saya</i>, Akses: <i>Siapa saja</i>) lalu salin URL Web App-nya ke form di bawah.
                  </p>
                </div>
              </div>

              {/* Code Box and Copy Section */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      📄 Kode Skrip Google Apps Script:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCodePreview(!showCodePreview)}
                      className="text-[11px] text-teal-700 hover:text-teal-900 underline font-semibold cursor-pointer"
                    >
                      {showCodePreview ? 'Sembunyikan Kode' : 'Tampilkan Kode Lengkap'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedScript ? 'Kode Berhasil Disalin!' : 'Salin Seluruh Kode Skrip'}</span>
                  </button>
                </div>

                {showCodePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                        <span className="ml-2 font-bold text-slate-300">Code.gs (Google Apps Script)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAppsScript}
                        className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedScript ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 select-all focus:outline-none">
                      <code>{GOOGLE_APPS_SCRIPT_TEMPLATE}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Input Apps Script URL Form */}
            <form
              onSubmit={handleSaveAppsScriptUrl}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Tautkan URL Aplikasi Web Google Apps Script (Berakhiran /exec):
                </label>
                {appsScriptUrl && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Terhubung
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputAppsScriptUrl}
                  onChange={e => setInputAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={savingAppsScript || !inputAppsScriptUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingAppsScript ? 'Menyimpan...' : 'Simpan & Hubungkan'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Nilai asesmen siswa akan otomatis terkirim langsung ke Spreadsheet setiap kali siswa menyelesaikan kuis.
              </p>
            </form>
          </div>
        )}

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

      {/* Intelligent Diagnostic Modal for Firebase / Google Errors */}
      {errorModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {errorModalInfo.title}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                    Kode: {errorModalInfo.code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setErrorModalInfo(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-3">
              <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {errorModalInfo.message}
              </p>

              {/* If domain error, show domain copy box */}
              {errorModalInfo.code === 'auth/unauthorized-domain' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">
                    Domain Aktif Aplikasi Anda:
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white font-mono font-bold text-slate-900 text-xs px-3 py-2 rounded-lg border border-amber-300">
                      {errorModalInfo.currentDomain}
                    </code>
                    <button
                      onClick={handleCopyCurrentDomain}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDomain ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Domain di atas harus ditambahkan ke daftar <b>Authorized domains</b> di Firebase Console.
                  </p>
                </div>
              )}

              {/* Solution steps */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">
                  Langkah-Langkah Solusi Penyelesaian:
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px]">
                  {errorModalInfo.solutionSteps.map((step, idx) => (
                    <li key={idx} className="leading-normal">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Direct links if available */}
              {errorModalInfo.actionLink && (
                <a
                  href={errorModalInfo.actionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{errorModalInfo.actionLinkLabel || 'Buka Halaman Terkait'}</span>
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              {errorModalInfo.canTryGsi ? (
                <button
                  onClick={handleSignInGsiDirect}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Coba via Google Identity (GSI)</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setErrorModalInfo(null);
                    setActiveTab('APPS_SCRIPT');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs cursor-pointer"
                >
                  Gunakan Apps Script Saja
                </button>
                <button
                  onClick={() => setErrorModalInfo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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


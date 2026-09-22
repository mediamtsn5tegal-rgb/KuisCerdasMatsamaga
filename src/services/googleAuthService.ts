import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

export interface AppGoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GoogleAuthErrorInfo {
  code: string;
  title: string;
  message: string;
  currentDomain: string;
  solutionSteps: string[];
  actionLink?: string;
  actionLinkLabel?: string;
  canTryGsi?: boolean;
}

// Initialize Firebase App if not already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentCustomUser: AppGoogleUser | null = null;

try {
  cachedAccessToken = sessionStorage.getItem('matsamaga_google_token');
  const storedUser = sessionStorage.getItem('matsamaga_google_user');
  if (storedUser) {
    currentCustomUser = JSON.parse(storedUser);
  }
} catch {}

/**
 * Loads the Google Identity Services (GSI) script dynamically if not yet ready
 */
export const loadGsiScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity Services')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'));
    document.head.appendChild(script);
  });
};

/**
 * Direct sign-in using Google Identity Services (GSI)
 * Bypasses Firebase Auth domain authorization restrictions completely.
 */
export const signInWithGsi = async (): Promise<{ user: AppGoogleUser; accessToken: string }> => {
  await loadGsiScript();

  return new Promise((resolve, reject) => {
    try {
      const clientId = firebaseConfig.oAuthClientId;
      if (!clientId) {
        throw new Error('OAuth Client ID tidak ditemukan pada konfigurasi proyek.');
      }

      if (!(window as any).google?.accounts?.oauth2) {
        throw new Error('Google Identity Services belum siap di browser Anda.');
      }

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        callback: async (tokenResp: any) => {
          if (tokenResp.error) {
            console.error('GSI OAuth Error:', tokenResp);
            reject(new Error(tokenResp.error_description || tokenResp.error || 'Autorisasi Google dibatalkan.'));
            return;
          }

          if (!tokenResp.access_token) {
            reject(new Error('Google tidak memberikan access token.'));
            return;
          }

          const token = tokenResp.access_token;
          cachedAccessToken = token;
          try {
            sessionStorage.setItem('matsamaga_google_token', token);
          } catch {}

          let userProfile: AppGoogleUser = {
            uid: `gsi_${Date.now()}`,
            displayName: 'Akun Google Madrasah',
            email: 'mediamtsntegal@gmail.com',
            photoURL: null
          };

          try {
            const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userinfoRes.ok) {
              const info = await userinfoRes.json();
              userProfile = {
                uid: info.sub || `gsi_${Date.now()}`,
                displayName: info.name || info.email || 'Pengguna Google',
                email: info.email || 'mediamtsntegal@gmail.com',
                photoURL: info.picture || null
              };
            }
          } catch (e) {
            console.warn('Gagal mengambil info profil Google:', e);
          }

          currentCustomUser = userProfile;
          try {
            sessionStorage.setItem('matsamaga_google_user', JSON.stringify(userProfile));
          } catch {}

          resolve({ user: userProfile, accessToken: token });
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Diagnostic parser for Firebase & Google OAuth errors
 */
export const parseGoogleAuthError = (error: any): GoogleAuthErrorInfo => {
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
  const code = error?.code || '';
  const msg = error?.message || String(error);

  if (
    code.includes('origin_mismatch') ||
    msg.includes('origin_mismatch') ||
    msg.includes('origin mismatch') ||
    msg.includes('Error 400') ||
    msg.includes('400')
  ) {
    return {
      code: 'google/origin-mismatch',
      title: 'Error 400: origin_mismatch (Asal JavaScript Belum Didaftarkan)',
      message: `Google OAuth memblokir login karena URL web saat ini ("${currentOrigin}") belum didaftarkan di daftar "Authorized JavaScript origins" (Asal JavaScript yang diotorisasi) pada Google Cloud Console.`,
      currentDomain: currentOrigin,
      solutionSteps: [
        `CARA CEPAT & BEBAS ERROR: Gunakan "Metode 2: Google Apps Script" (tab hijau toska). Metode ini 100% langsung bekerja tanpa konfigurasi domain/Google Cloud!`,
        `JIKA INGIN MEMPERBAIKI DI GOOGLE CLOUD: Buka Google Cloud Console > APIs & Services > Credentials.`,
        `Klik nama OAuth 2.0 Client ID (${firebaseConfig.oAuthClientId?.substring(0, 20)}...).`,
        `Di bagian "Authorized JavaScript origins", klik "+ ADD URI" lalu tempelkan: "${currentOrigin}" (pastikan tanpa garis miring di akhir).`,
        `Klik tombol SIMPAN (Save), tunggu 1-2 menit, lalu coba hubungkan kembali.`
      ],
      actionLink: `https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId}`,
      actionLinkLabel: 'Buka Kredensial di Google Cloud Console',
      canTryGsi: false
    };
  }

  if (code.includes('unauthorized-domain') || msg.includes('unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      title: 'Domain Belum Terdaftar di Firebase Console',
      message: `Domain tempat aplikasi dijalankan saat ini ("${currentDomain}") belum didaftarkan di daftar Authorized Domains Firebase Authentication proyek Anda.`,
      currentDomain,
      solutionSteps: [
        `Buka Firebase Console pada proyek "${firebaseConfig.projectId}".`,
        'Masuk ke menu Authentication > klik tab Settings (Pengaturan).',
        'Pilih bagian "Authorized domains" (Domain yang diotorisasi) > klik tombol "Add domain".',
        `Salin dan tempelkan domain saat ini: "${currentDomain}" lalu klik Simpan/Add.`,
        'Setelah tersimpan, coba klik kembali "Hubungkan Akun Google".',
        'ATAU: Gunakan metode "Google Identity Services (GSI)" atau "Google Apps Script" di bawah yang tidak memerlukan pendaftaran domain Firebase!'
      ],
      actionLink: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`,
      actionLinkLabel: 'Buka Pengaturan Authorized Domains di Firebase Console',
      canTryGsi: true
    };
  }

  if (code.includes('operation-not-allowed') || msg.includes('operation-not-allowed')) {
    return {
      code: 'auth/operation-not-allowed',
      title: 'Metode Login Google Belum Diaktifkan di Firebase',
      message: 'Metode sign-in Google Provider belum diaktifkan pada Firebase Console.',
      currentDomain,
      solutionSteps: [
        `Buka Firebase Console proyek "${firebaseConfig.projectId}".`,
        'Masuk ke menu Authentication > tab "Sign-in method" (Metode login).',
        'Klik penyedia "Google" di daftar provider.',
        'Aktifkan sakelar (Enable) dan masukkan email dukungan proyek.',
        'Klik tombol "Simpan" (Save).'
      ],
      actionLink: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`,
      actionLinkLabel: 'Buka Halaman Sign-in Method di Firebase Console',
      canTryGsi: true
    };
  }

  if (code.includes('popup-blocked') || msg.includes('popup-blocked')) {
    return {
      code: 'auth/popup-blocked',
      title: 'Jendela Pop-up Login Diblokir Browser',
      message: 'Browser Anda memblokir jendela popup login Google yang baru saja dibuka.',
      currentDomain,
      solutionSteps: [
        'Perhatikan bilah alamat (URL bar) browser Anda di bagian atas atau kanan.',
        'Klik ikon pop-up terblokir atau tanda peringatan gembok.',
        'Pilih "Selalu izinkan pop-up dan pengalihan dari situs ini" (Always allow popups).',
        'Klik Selesai, lalu klik kembali tombol "Hubungkan Akun Google".'
      ],
      canTryGsi: false
    };
  }

  if (code.includes('popup-closed-by-user') || msg.includes('popup-closed-by-user')) {
    return {
      code: 'auth/popup-closed-by-user',
      title: 'Jendela Login Ditutup Sebelum Selesai',
      message: 'Jendela otorisasi Google ditutup sebelum Anda menyelesaikan login.',
      currentDomain,
      solutionSteps: [
        'Silakan klik kembali tombol "Hubungkan Akun Google".',
        'Pilih akun Google Anda (misal mediamtsntegal@gmail.com).',
        'Berikan centang izin akses Google Spreadsheet & Drive file agar kuis dapat membuat spreadsheet.'
      ],
      canTryGsi: true
    };
  }

  if (
    msg.includes('verification') ||
    msg.includes('test') ||
    msg.includes('access_denied') ||
    msg.includes('403') ||
    msg.includes('unverified')
  ) {
    return {
      code: 'google/unverified-app',
      title: 'Aplikasi Dalam Mode Pengujian (Test Users)',
      message: 'Google Cloud Console membatasi akses OAuth hanya untuk email penguji (Test Users).',
      currentDomain,
      solutionSteps: [
        'Cara Cepat: Pada jendela Google "Aplikasi belum diverifikasi", klik tulisan "Lanjutan" (Advanced) di kiri bawah > klik "Buka gen-lang-client... (tidak aman)" > klik Lanjutkan.',
        `Cara Permanen: Buka console.cloud.google.com > project "${firebaseConfig.projectId}" > APIs & Services > OAuth consent screen > tambahkan email Anda ke daftar "Test users".`,
        'Atau klik tombol "PUBLISH APP" di OAuth consent screen agar dapat diakses semua akun.'
      ],
      actionLink: `https://console.cloud.google.com/apis/credentials/consent?project=${firebaseConfig.projectId}`,
      actionLinkLabel: 'Buka OAuth Consent Screen Google Cloud',
      canTryGsi: true
    };
  }

  return {
    code: code || 'auth/unknown',
    title: 'Terjadi Kendala Autentikasi Google',
    message: msg || 'Gagal melakukan otentikasi dengan akun Google.',
    currentDomain,
    solutionSteps: [
      'Pastikan koneksi internet Anda stabil.',
      'Coba gunakan opsi "Hubungkan via Google Identity Services (GSI)" yang tersedia di tombol samping.',
      'Atau gunakan metode "Google Apps Script Web App" yang 100% bebas dari batasan Firebase dan domain.'
    ],
    canTryGsi: true
  };
};

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: AppGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      const token = cachedAccessToken || sessionStorage.getItem('matsamaga_google_token');
      if (token) {
        cachedAccessToken = token;
        const appUser: AppGoogleUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        };
        currentCustomUser = appUser;
        if (onAuthSuccess) onAuthSuccess(appUser, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else if (currentCustomUser && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(currentCustomUser, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      currentCustomUser = null;
      try {
        sessionStorage.removeItem('matsamaga_google_token');
        sessionStorage.removeItem('matsamaga_google_user');
      } catch {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Primary sign-in function with automatic GSI fallback if domain error occurs
export const googleSignIn = async (
  preferGsi = false
): Promise<{ user: AppGoogleUser; accessToken: string }> => {
  if (preferGsi) {
    return signInWithGsi();
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token dari Google OAuth');
    }

    cachedAccessToken = credential.accessToken;
    const appUser: AppGoogleUser = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL
    };
    currentCustomUser = appUser;

    try {
      sessionStorage.setItem('matsamaga_google_token', credential.accessToken);
      sessionStorage.setItem('matsamaga_google_user', JSON.stringify(appUser));
    } catch {}

    return { user: appUser, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Firebase signInWithPopup failed:', error);
    const errCode = error?.code || '';

    // If unauthorized-domain or operation-not-allowed, auto-attempt GSI fallback
    if (
      errCode.includes('unauthorized-domain') ||
      errCode.includes('operation-not-allowed') ||
      errCode.includes('internal-error')
    ) {
      console.info('Auto-switching to Google Identity Services (GSI) fallback...');
      try {
        return await signInWithGsi();
      } catch (gsiErr: any) {
        console.error('GSI fallback error:', gsiErr);
        // Throw the original Firebase error or GSI error with diagnostic metadata
        throw error;
      }
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const saved = sessionStorage.getItem('matsamaga_google_token');
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  } catch {}
  return null;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem('matsamaga_google_token', token);
    } else {
      sessionStorage.removeItem('matsamaga_google_token');
      sessionStorage.removeItem('matsamaga_google_user');
    }
  } catch {}
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  currentCustomUser = null;
  try {
    sessionStorage.removeItem('matsamaga_google_token');
    sessionStorage.removeItem('matsamaga_google_user');
  } catch {}
};


# PANDUAN LENGKAP DEPLOY & PUBLISH APLIKASI KUIS CERDAS MATSAMAGA
MTs Negeri 5 Tegal - Pengembang: Supro, S.Pd.

Dokumen ini berisi solusi teknis mengatasi kendala deployment serta panduan langkah demi langkah yang sangat mudah diikuti untuk mempublikasikan (mendeploy) aplikasi agar dapat diakses oleh seluruh guru dan siswa melalui HP, tablet, maupun komputer.

---

## ⚠️ SOLUSI MASALAH: "Gagal Menghubungi Server" Saat Deploy di Vercel

Jika Anda menemui pesan **"Gagal menghubungi server"** setelah mem-publish repositori GitHub ke Vercel, berikut adalah penjelasan teknis dan langkah perbaikannya:

### 1. Mengapa Masalah Tersebut Terjadi?
* **Karakteristik Vercel:** Vercel dirancang sebagai platform hosting frontend statis (JAMstack) dan fungsi serverless (AWS Lambda). Vercel **tidak menjalankan server Node.js latar belakang (background persistent process)** seperti `node server.ts`.
* **Arsitektur Aplikasi:** Aplikasi Kuis Cerdas Matsamaga adalah aplikasi **Full-Stack** (React Vite + Backend Express). Backend melayani seluruh endpoint data `/api/*` (autentikasi login, bank soal, simpan nilai, dan sinkronisasi Google Spreadsheet).
* **Penyebab Error:** Ketika di-deploy ke Vercel tanpa konfigurasi serverless, Vercel hanya mem-build file HTML/JS statis ke folder `dist/`. Ketika pengguna membuka web dan mencoba login atau memuat kuis, frontend memanggil `/api/auth/...`, namun Vercel menjawab dengan `404 Not Found` atau mengembalikan halaman HTML. Akibatnya, sistem menampilkan notifikasi *"Gagal menghubungi server"*.

### 2. Perbaikan yang Telah Diimplementasikan pada Kode Ini:
1. **Dibuat Serverless Entrypoint (`/api/index.ts`):** Mengadaptasi aplikasi Express.js agar dapat dieksekusi secara otomatis oleh Vercel Node.js Serverless Function setiap kali ada permintaan ke `/api/*`.
2. **Dibuat Konfigurasi `vercel.json`:** Mengatur routing *rewrites* agar seluruh endpoint `/api/*` dialirkan ke `/api/index.ts`, dan rute tampilan dialirkan ke `/index.html` (SPA routing).
3. **Kompatibilitas Read-Only Filesystem (`server/db.ts`):** Lingkungan Vercel memiliki sistem file yang *read-only*. Kode telah disesuaikan agar otomatis mendeteksi environment Vercel dan menggunakan direktori `/tmp` untuk penyimpanan temporer tanpa menimbulkan crash `EROFS`.
4. **Resilient Local Fallback (Mode Siap Pakai):** Pada halaman login, jika serverless mengalami *cold-start* atau offline, sistem secara otomatis mengaktifkan mode mandiri sehingga Guru (Supro, S.Pd.), Admin, dan Siswa tetap dapat langsung masuk dan menjalankan kuis.

### 3. Langkah-Langkah Mengatasi di Vercel (Redeploy):
1. **Perbarui Repositori GitHub:**
   - Di Google AI Studio, klik menu **Settings** > **Export to GitHub** (atau lakukan `git push` ke repositori Anda).
   - Pastikan file `api/index.ts`, `vercel.json`, dan `server/db.ts` yang telah diperbarui sudah masuk ke GitHub.
2. **Konfigurasi Environment Variable di Vercel:**
   - Masuk ke dashboard [vercel.com](https://vercel.com).
   - Buka proyek aplikasi Kuis Matsamaga Anda.
   - Klik tab **Settings** di bagian atas > pilih menu **Environment Variables**.
   - Tambahkan variabel:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: *(Isi dengan API Key Gemini dari Google AI Studio)*
   - Klik **Save**.
3. **Redeploy Proyek di Vercel:**
   - Buka tab **Deployments** di Vercel.
   - Pada deployment paling atas, klik menu titik tiga (`...`) di kanan > pilih **Redeploy**.
   - Centang opsi **Clear Build Cache** > klik **Redeploy**.
   - Tunggu hingga proses build selesai (berstatus *Ready*).
4. **Uji Coba:**
   - Buka domain Vercel Anda (misal `https://kuis-cerdas-matsamaga.vercel.app`).
   - Coba masuk sebagai Siswa atau klik akun Supro, S.Pd. Aplikasi kini dapat terhubung secara lancar!

---

## PILIHAN METODE DEPLOY ALTERNATIF

Jika Anda menginginkan server yang berjalan penuh dengan database file lokal yang terus tersimpan tanpa batasan *stateless serverless*, Anda sangat disarankan menggunakan **Render.com** (Gratis & Sangat Stabil untuk Node.js):

1. **METODE 1: Vercel (Serverless + Frontend)** - Sudah dikonfigurasi dengan `vercel.json` & `api/index.ts`.
2. **METODE 2: Render.com (Rekomendasi Full-Stack Terbaik)** - Menjalankan `server.ts` secara persisten, gratis, dan mendukung custom domain madrasah.
3. **METODE 3: Google AI Studio Cloud Run (1-Klik Instan)**.
4. **METODE 4: VPS / Server Linux Madrasah**.

---

## METODE 1: DEPLOY INSTAN LANGSUNG DARI GOOGLE AI STUDIO (1-KLIK)

Metode ini adalah cara tercepat karena server sudah disediakan oleh Google Cloud:

### Langkah 1: Pastikan API Key Gemini Sudah Terpasang
1. Pada layar Google AI Studio, klik menu **Settings** (ikon gerigi) di pojok kiri bawah atau kanan atas.
2. Pilih submenu **API Keys** atau **Environment Variables**.
3. Pastikan variabel `GEMINI_API_KEY` sudah terisi dengan API Key Gemini Anda.
   *(Jika belum, klik "Create API Key" di [aistudio.google.com](https://aistudio.google.com) lalu simpan)*.

### Langkah 2: Publikasikan Aplikasi (Share / Deploy)
1. Di pojok kanan atas jendela AI Studio, klik tombol **Share** atau **Deploy**.
2. Jika memilih **Share**:
   - Atur perizinan menjadi **Public (Siapa saja yang memiliki link dapat mengakses)**.
   - Salin link aplikasi yang dihasilkan, contohnya:
     `https://ais-pre-oytivf3hz3un322ggyxc3c-183289005381.asia-southeast1.run.app`
3. Jika memilih **Deploy to Cloud Run**:
   - Klik **Deploy**.
   - Tunggu proses build selesai (sekitar 1-2 menit).
   - Aplikasi Anda kini resmi berjalan online di Google Cloud Run dengan sertifikat SSL (HTTPS) resmi.

---

## METODE 2: DEPLOY KE CLOUD HOSTING (RENDER.COM) MENGGUNAKAN GITHUB

Metode ini sangat disukai karena gratis, otomatis update jika ada perubahan kode, dan bisa menggunakan custom domain madrasah (seperti `kuis.mtsn5tegal.sch.id`).

### Langkah 1: Ekspor Kode ke GitHub
1. Di Google AI Studio, klik menu **Settings** > pilih **Export to GitHub**.
2. Hubungkan dengan akun GitHub Anda (misal akun `mediamtsntegal` atau akun pribadi).
3. Buat repositori baru, misalnya bernama: `kuis-cerdas-matsamaga`.

### Langkah 2: Mendaftar di Render.com
1. Buka situs [https://render.com](https://render.com) di browser.
2. Klik **Sign Up** lalu pilih **Continue with GitHub** (gunakan akun GitHub yang sama).

### Langkah 3: Membuat Web Service Baru
1. Di dashboard Render, klik tombol **New +** di pojok kanan atas > pilih **Web Service**.
2. Pilih opsi **Build and deploy from a Git repository** > klik **Next**.
3. Pilih repositori `kuis-cerdas-matsamaga` yang tadi diekspor > klik **Connect**.

### Langkah 4: Pengaturan Konfigurasi (Sangat Penting)
Isi formulir konfigurasi Render dengan rincian berikut:
- **Name**: `kuis-cerdas-matsamaga` (atau nama lain yang diinginkan)
- **Region**: `Singapore (Southeast Asia)` *(Paling cepat diakses dari Indonesia)*
- **Branch**: `main`
- **Root Directory**: *(Biarkan kosong)*
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm run start
  ```
- **Instance Type**: Pilih `Free`

### Langkah 5: Masukkan Environment Variables
Scroll ke bawah ke bagian **Environment Variables**, lalu tambahkan:
- Key: `GEMINI_API_KEY`  
  Value: *(Salin dan tempel API Key Gemini Anda)*
- Key: `NODE_ENV`  
  Value: `production`

### Langkah 6: Jalankan Deploy
1. Klik tombol **Deploy Web Service** di bagian bawah.
2. Render akan secara otomatis menjalankan instalasi library, mengompilasi Vite React, dan menyatukan server Node.js.
3. Setelah proses selesai (status bertuliskan **Live** berwarna hijau), tautan aplikasi Anda akan muncul di bagian atas, misalnya:
   `https://kuis-cerdas-matsamaga.onrender.com`
4. Bagikan link tersebut kepada siswa dan dewan guru MTsN 5 Tegal.

---

## METODE 3: DEPLOY DI VPS MADRASAH (UBUNTU / DEBIAN LINUX)

Jika madrasah memiliki server sendiri:

1. **Install Node.js 18 atau 20**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Unduh Kode Aplikasi**:
   Ekstrak file zip dari AI Studio ke folder `/var/www/kuis-cerdas-matsamaga`.

3. **Install Dependencies & Kompilasi**:
   ```bash
   cd /var/www/kuis-cerdas-matsamaga
   npm install
   npm run build
   ```

4. **Jalankan Aplikasi dengan PM2 (Process Manager agar terus menyala)**:
   ```bash
   sudo npm install -g pm2
   export GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   export NODE_ENV="production"
   pm2 start dist/server.cjs --name "kuis-matsamaga"
   pm2 startup
   pm2 save
   ```

5. **Aplikasi siap**: Berjalan di port `3000` dan dapat diarahkan ke Nginx dengan domain madrasah.

---

## CHECKLIST AKHIR SETELAH APLIKASI ONLINE

Setelah aplikasi terpublikasi:
- [ ] Buka tautan di browser HP untuk menguji tampilan mobile.
- [ ] Buka menu **Guru** atau **Admin** > klik **Google Spreadsheet** > hubungkan akun `mediamtsntegal@gmail.com`.
- [ ] Klik **Buat Spreadsheet MTsN 5 Tegal Otomatis** agar nilai ujian langsung tersimpan rapi di Google Drive.
- [ ] Lakukan uji coba mengerjakan 1 kuis untuk memastikan nilai masuk ke lembar kerja `Hasil_Asesmen_Siswa`.

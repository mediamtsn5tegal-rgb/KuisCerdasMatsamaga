# PANDUAN LENGKAP DEPLOY & PUBLISH APLIKASI KUIS CERDAS MATSAMAGA
MTs Negeri 5 Tegal - Pengembang: Supro, S.Pd.

Dokumen ini berisi panduan langkah demi langkah yang sangat mudah diikuti untuk mempublikasikan (mendeploy) aplikasi agar dapat diakses oleh seluruh guru dan siswa melalui HP, tablet, maupun komputer.

---

## PILIHAN METODE DEPLOY

Anda dapat memilih metode yang paling sesuai dengan kebutuhan:
1. **METODE 1: Deploy Instan Melalui Google AI Studio (Paling Mudah & Gratis)** - Tanpa perlu instalasi apapun di komputer.
2. **METODE 2: Deploy Menggunakan Render.com (Gratis & Mendukung Domain Madrasah)** - Sangat stabil untuk hosting full-stack (Node.js + Express + React).
3. **METODE 3: Deploy Menggunakan Railway.app (Gratis / Trial)** - Cepat dan otomatis terkoneksi dengan GitHub.
4. **METODE 4: Deploy di VPS Madrasah / Server Linux Sendiri**.

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

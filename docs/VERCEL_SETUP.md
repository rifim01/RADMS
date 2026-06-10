# Panduan Setup Vercel untuk RADMS

Panduan lengkap untuk mendeploy aplikasi RADMS (frontend-dashboard dan frontend-driver) ke Vercel.

---

## Prasyarat

Sebelum memulai, pastikan Anda sudah memiliki:
- Node.js versi 18 atau lebih baru (cek dengan `node --version`)
- npm versi 9 atau lebih baru (cek dengan `npm --version`)
- Akun GitHub dengan repository RADMS sudah dipush
- Firebase project sudah dikonfigurasi (lihat `FIREBASE_SETUP.md`)

---

## Bagian 1: Setup Akun Vercel

### 1.1 Buat Akun Vercel

1. Buka browser dan kunjungi **https://vercel.com**
2. Klik tombol **"Sign Up"** di pojok kanan atas
3. Pilih metode registrasi:
   - **"Continue with GitHub"** (direkomendasikan — memudahkan auto-deploy)
   - Atau gunakan email
4. Jika menggunakan GitHub: otorisasi Vercel untuk mengakses akun GitHub Anda
5. Pilih plan **"Hobby"** (gratis) untuk keperluan development dan production skala kecil
6. Isi profil singkat lalu klik **"Continue"**

> **Catatan:** Plan Hobby Vercel sudah mencukupi untuk RADMS. Batasan: 100 GB bandwidth/bulan, unlimited deployments.

---

## Bagian 2: Install dan Konfigurasi Vercel CLI

### 2.1 Install Vercel CLI

Buka terminal dan jalankan:

```bash
npm install -g vercel
```

Verifikasi instalasi:

```bash
vercel --version
# Output: Vercel CLI 39.x.x (atau versi terbaru)
```

### 2.2 Login ke Vercel CLI

```bash
vercel login
```

Pilih metode login:
- **Continue with GitHub** (direkomendasikan)
- Continue with Email
- Continue with GitLab
- Continue with Bitbucket

Ikuti instruksi di browser yang terbuka secara otomatis. Setelah berhasil, terminal akan menampilkan:

```
> Success! Email rifim01@adminrifim.org connected to GitHub account
```

---

## Bagian 3: Deploy frontend-dashboard

### 3.1 Build dan Deploy

```bash
# Masuk ke direktori frontend-dashboard
cd /path/ke/RADMS/frontend-dashboard

# Install dependencies (jika belum)
npm install

# Build untuk production
npm run build

# Deploy ke Vercel
vercel --prod
```

### 3.2 Konfigurasi saat Deploy Pertama Kali

Saat pertama kali menjalankan `vercel --prod`, CLI akan menanyakan beberapa pertanyaan:

```
? Set up and deploy "frontend-dashboard"? [Y/n] Y
? Which scope do you want to deploy to? your-username
? Link to existing project? [y/N] N
? What's your project's name? radms-dashboard
? In which directory is your code located? ./
? Want to modify these settings? [y/N] N
```

Setelah deploy selesai, Anda akan mendapat URL seperti:
```
https://radms-dashboard.vercel.app
```

### 3.3 Konfigurasi vercel.json untuk frontend-dashboard

Buat file `vercel.json` di dalam folder `frontend-dashboard/`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Bagian 4: Deploy frontend-driver

### 4.1 Build dan Deploy

```bash
# Masuk ke direktori frontend-driver
cd /path/ke/RADMS/frontend-driver

# Install dependencies (jika belum)
npm install

# Build untuk production
npm run build

# Deploy ke Vercel
vercel --prod
```

### 4.2 Konfigurasi saat Deploy Pertama Kali

```
? Set up and deploy "frontend-driver"? [Y/n] Y
? Which scope do you want to deploy to? your-username
? Link to existing project? [y/N] N
? What's your project's name? radms-driver
? In which directory is your code located? ./
? Want to modify these settings? [y/N] N
```

URL yang dihasilkan:
```
https://radms-driver.vercel.app
```

### 4.3 Konfigurasi vercel.json untuk frontend-driver

Buat file `vercel.json` di dalam folder `frontend-driver/`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## Bagian 5: Environment Variables

### 5.1 Tambah Environment Variables via Vercel Dashboard

1. Buka **https://vercel.com/dashboard**
2. Klik project yang ingin dikonfigurasi (misalnya `radms-dashboard`)
3. Klik tab **"Settings"**
4. Di sidebar kiri, klik **"Environment Variables"**
5. Untuk setiap variabel di bawah, klik **"Add New"**:
   - Isi **"Key"** (nama variabel)
   - Isi **"Value"** (nilai variabel)
   - Pilih environment: centang **Production**, **Preview**, dan **Development**
   - Klik **"Save"**

### 5.2 Daftar Environment Variables

#### Untuk `radms-dashboard` (frontend-dashboard):

| Key | Keterangan | Contoh Nilai |
|-----|-----------|--------------|
| `VITE_FIREBASE_API_KEY` | API Key dari Firebase Console | `AIzaSyAbc123...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain Firebase | `rifim-radms.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | URL Realtime Database | `https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID Firebase | `rifim-radms` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket Firebase | `rifim-radms.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID untuk FCM | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID Firebase | `1:123456789:web:abc123` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Measurement ID (opsional, untuk Analytics) | `G-XXXXXXXXXX` |
| `VITE_APPS_SCRIPT_URL` | URL deployment Google Apps Script | `https://script.google.com/macros/s/...` |
| `VITE_FIREBASE_VAPID_KEY` | VAPID key untuk Web Push Notifications | `BN...` |

#### Untuk `radms-driver` (frontend-driver):

| Key | Keterangan | Contoh Nilai |
|-----|-----------|--------------|
| `VITE_FIREBASE_API_KEY` | API Key dari Firebase Console | `AIzaSyAbc123...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain Firebase | `rifim-radms.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | URL Realtime Database | `https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID Firebase | `rifim-radms` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket Firebase | `rifim-radms.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID untuk FCM | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID Firebase | `1:123456789:web:abc123` |
| `VITE_APPS_SCRIPT_URL` | URL deployment Google Apps Script | `https://script.google.com/macros/s/...` |
| `VITE_FIREBASE_VAPID_KEY` | VAPID key untuk Web Push Notifications | `BN...` |

### 5.3 Tambah Environment Variables via CLI

Alternatif lain, gunakan Vercel CLI:

```bash
# Tambah satu variabel
vercel env add VITE_FIREBASE_API_KEY production

# Tambah dari file .env (hati-hati: jangan commit file .env ke git!)
vercel env pull .env.local
```

---

## Bagian 6: Custom Domain

### 6.1 Tambah Custom Domain di Vercel Dashboard

1. Buka **https://vercel.com/dashboard**
2. Pilih project (misal: `radms-dashboard`)
3. Klik tab **"Settings"** → **"Domains"**
4. Klik **"Add"**
5. Masukkan domain Anda, misalnya: `dashboard.rifim.id`
6. Klik **"Add"**

### 6.2 Konfigurasi DNS

Vercel akan menampilkan instruksi DNS. Masuk ke panel DNS domain registrar Anda (GoDaddy, Namecheap, Niagahoster, dll.) dan tambahkan record berikut:

**Untuk root domain (rifim.id):**
```
Type  : A
Name  : @
Value : 76.76.21.21
```

**Untuk subdomain (dashboard.rifim.id):**
```
Type  : CNAME
Name  : dashboard
Value : cname.vercel-dns.com
```

**Untuk subdomain driver (driver.rifim.id):**
```
Type  : CNAME
Name  : driver
Value : cname.vercel-dns.com
```

> **Catatan:** Perubahan DNS bisa memakan waktu 1–48 jam untuk propagasi penuh.

### 6.3 SSL Certificate

Vercel otomatis menyediakan SSL certificate (HTTPS) gratis via Let's Encrypt. Setelah DNS terverifikasi, sertifikat akan aktif secara otomatis. Tidak perlu konfigurasi manual.

---

## Bagian 7: Auto-deploy dari GitHub

### 7.1 Hubungkan Repository GitHub ke Vercel

1. Buka **https://vercel.com/dashboard**
2. Klik **"Add New Project"**
3. Di bagian **"Import Git Repository"**, klik **"Continue with GitHub"**
4. Pilih repository `RADMS`
5. Klik **"Import"**
6. Konfigurasi project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend-dashboard` (atau `frontend-driver` untuk project kedua)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. Klik **"Deploy"**

### 7.2 Cara Kerja Auto-deploy

Setelah terhubung ke GitHub:
- **Push ke branch `main`/`master`** → otomatis deploy ke production
- **Push ke branch lain** → otomatis deploy ke preview URL (contoh: `radms-dashboard-git-fitur-baru.vercel.app`)
- **Pull Request dibuka** → otomatis membuat preview deployment, URL akan muncul sebagai komentar di PR

### 7.3 Konfigurasi Branch untuk Deploy

1. Settings → Git
2. Di bagian **"Production Branch"**, ubah ke nama branch utama Anda (default: `main`)
3. Optionally aktifkan **"Preview Deployments"** untuk branch lain

---

## Bagian 8: GitHub Actions CI/CD (Opsional)

### 8.1 Buat Workflow File

Buat file di repository: `.github/workflows/deploy.yml`

```yaml
name: Deploy RADMS ke Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy-dashboard:
    name: Deploy Frontend Dashboard
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend-dashboard

    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend-dashboard/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests (jika ada)
        run: npm test --if-present

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_APPS_SCRIPT_URL: ${{ secrets.VITE_APPS_SCRIPT_URL }}
          VITE_FIREBASE_VAPID_KEY: ${{ secrets.VITE_FIREBASE_VAPID_KEY }}

      - name: Deploy ke Vercel Production
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}
          vercel-args: '--prod'
          working-directory: frontend-dashboard

      - name: Deploy ke Vercel Preview
        if: github.event_name == 'pull_request'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DASHBOARD }}
          working-directory: frontend-dashboard

  deploy-driver:
    name: Deploy Frontend Driver
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend-driver

    steps:
      - name: Checkout kode
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend-driver/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_DATABASE_URL: ${{ secrets.VITE_FIREBASE_DATABASE_URL }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_APPS_SCRIPT_URL: ${{ secrets.VITE_APPS_SCRIPT_URL }}
          VITE_FIREBASE_VAPID_KEY: ${{ secrets.VITE_FIREBASE_VAPID_KEY }}

      - name: Deploy ke Vercel Production
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DRIVER }}
          vercel-args: '--prod'
          working-directory: frontend-driver

      - name: Deploy ke Vercel Preview
        if: github.event_name == 'pull_request'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DRIVER }}
          working-directory: frontend-driver
```

### 8.2 Tambah GitHub Secrets

1. Di repository GitHub, klik **Settings** → **Secrets and variables** → **Actions**
2. Klik **"New repository secret"** untuk setiap secret berikut:

| Secret Name | Cara Mendapatkan |
|-------------|-----------------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General → Team ID (atau Personal Account ID) |
| `VERCEL_PROJECT_ID_DASHBOARD` | Vercel project settings → General → Project ID |
| `VERCEL_PROJECT_ID_DRIVER` | Vercel project settings → General → Project ID |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Console → Realtime Database |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings |
| `VITE_APPS_SCRIPT_URL` | Google Apps Script → Deploy → Manage deployments |
| `VITE_FIREBASE_VAPID_KEY` | Firebase Console → Project Settings → Cloud Messaging |

### 8.3 Cara Mendapatkan VERCEL_TOKEN

1. Login ke **https://vercel.com**
2. Klik avatar/foto profil → **Settings**
3. Di sidebar, klik **Tokens**
4. Klik **"Create"**
5. Beri nama token (misal: `github-actions-radms`)
6. Pilih scope: **Full Account**
7. Set expiration sesuai kebutuhan
8. Klik **"Create Token"**
9. **Salin token sekarang** — tidak bisa dilihat lagi setelah menutup halaman ini

---

## Bagian 9: Monitoring dan Logs

### 9.1 Lihat Deployment Logs

1. Buka **https://vercel.com/dashboard**
2. Klik project → klik deployment yang ingin diperiksa
3. Tab **"Build Logs"**: log proses build
4. Tab **"Runtime Logs"**: log saat runtime (untuk Serverless Functions)

### 9.2 Analytic via Vercel Dashboard

1. Project → **Analytics**
2. Pantau:
   - Jumlah visitors
   - Page views
   - Core Web Vitals (LCP, FID, CLS)

---

## Bagian 10: Troubleshooting

### Error: "Command 'npm run build' exited with 1"

**Penyebab:** Build gagal karena error di kode atau environment variable tidak tersedia.

**Solusi:**
```bash
# Coba build lokal terlebih dahulu
npm run build

# Jika berhasil lokal tapi gagal di Vercel, periksa env vars di Vercel dashboard
# Pastikan semua VITE_ variables sudah ditambahkan
```

---

### Error: "Cannot find module 'firebase/app'"

**Penyebab:** Dependencies tidak terinstall atau `package.json` tidak lengkap.

**Solusi:**
```bash
# Hapus node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install

# Push ulang ke GitHub atau deploy ulang
vercel --prod
```

---

### Error: 404 pada halaman selain root (setelah refresh)

**Penyebab:** React Router menggunakan client-side routing, tapi server mengembalikan 404 untuk path yang tidak dikenal.

**Solusi:** Pastikan file `vercel.json` sudah memiliki konfigurasi `rewrites` seperti di Bagian 3.3 dan 4.3.

---

### Error: "CORS policy" saat memanggil Apps Script

**Penyebab:** Google Apps Script tidak mengizinkan request dari domain Vercel.

**Solusi:** Pastikan Apps Script di-deploy dengan setting:
- **Execute as:** Me
- **Who has access:** Anyone

Lalu update URL di environment variable dengan URL deployment terbaru.

---

### Error: "Environment variable not found" di production

**Penyebab:** Environment variable ditambahkan ke Vercel setelah deployment terakhir.

**Solusi:**
1. Vercel Dashboard → Project → Deployments
2. Klik titik tiga (...) pada deployment terbaru
3. Klik **"Redeploy"**
4. Centang **"Use existing Build Cache"** jika tidak ada perubahan kode

---

### Preview deployment tidak update

**Penyebab:** Cache Vercel masih menggunakan build lama.

**Solusi:**
```bash
# Force deploy tanpa cache
vercel --prod --force
```

---

### Build lambat atau timeout

**Penyebab:** Dependencies terlalu besar atau proses build lama.

**Solusi:**
```bash
# Cek ukuran bundle
npm run build -- --report

# Pastikan tidak ada dependencies development yang ikut ke production bundle
# Periksa vite.config.js untuk optimasi build
```

---

## Ringkasan Checklist Deploy

Gunakan checklist ini setiap kali deploy ke production:

- [ ] `npm run build` berhasil di lokal
- [ ] Semua environment variables sudah dikonfigurasi di Vercel
- [ ] File `vercel.json` sudah ada di folder masing-masing app
- [ ] Domain sudah dikonfigurasi (jika menggunakan custom domain)
- [ ] Firebase security rules sudah diupdate (bukan test mode)
- [ ] Apps Script URL sudah benar dan aktif
- [ ] Test login dan fitur utama setelah deploy

---

*Panduan ini berlaku untuk RADMS versi terkini. Untuk pertanyaan lebih lanjut, hubungi tim developer RADMS.*

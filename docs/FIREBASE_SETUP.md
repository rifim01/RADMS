# Panduan Setup Firebase untuk RADMS

Panduan lengkap untuk mengkonfigurasi Firebase sebagai backend RADMS, mencakup Realtime Database, Authentication, Cloud Messaging (FCM), dan integrasi Google Apps Script.

---

## Prasyarat

Sebelum memulai, pastikan Anda sudah memiliki:
- Akun Google (Gmail)
- Node.js versi 18 atau lebih baru
- npm versi 9 atau lebih baru
- Kode sumber RADMS sudah ada di komputer Anda

---

## Step 1: Buat Firebase Project

### 1.1 Buka Firebase Console

1. Buka browser dan kunjungi **https://console.firebase.google.com**
2. Login dengan akun Google Anda
3. Halaman utama Firebase Console akan tampil

### 1.2 Buat Project Baru

1. Klik tombol **"Add project"** (atau **"Create a project"**)
2. Di kolom **"Project name"**, ketik: `rifim-radms`
   > Firebase akan otomatis membuat Project ID: `rifim-radms` (atau `rifim-radms-xxxxx` jika sudah ada)
3. Klik **"Continue"**

### 1.3 Konfigurasi Google Analytics

1. Anda akan ditanya: *"Enable Google Analytics for this project?"*
   - Pilih **"Enable"** jika ingin tracking penggunaan aplikasi
   - Pilih **"Disable"** jika tidak diperlukan (bisa diaktifkan nanti)
2. Jika enable: pilih akun Google Analytics yang ada atau buat baru
3. Klik **"Create project"**

### 1.4 Tunggu Project Dibuat

Firebase akan memproses selama beberapa detik. Setelah selesai, klik **"Continue"** untuk masuk ke dashboard project.

> **Tampilan:** Anda akan melihat halaman overview project dengan ikon-ikon layanan Firebase di tengah halaman.

---

## Step 2: Setup Realtime Database

### 2.1 Buka Realtime Database

1. Di sidebar kiri Firebase Console, klik **"Build"** untuk membuka submenu
2. Klik **"Realtime Database"**
3. Halaman Realtime Database akan tampil

### 2.2 Buat Database

1. Klik tombol **"Create database"**
2. Dialog pemilihan lokasi akan muncul

### 2.3 Pilih Region Database

1. Di dropdown **"Realtime Database location"**, pilih:
   ```
   asia-southeast1 (Singapore)
   ```
   > Pilih Singapore agar latensi rendah untuk pengguna di Indonesia

2. Klik **"Next"**

### 2.4 Pilih Mode Security Rules

1. Pilih **"Start in test mode"**
   > ⚠️ Mode test membuka akses read/write ke semua orang selama 30 hari. Harus diperbarui ke rules yang tepat sebelum production (lihat Step 8).
2. Klik **"Enable"**

### 2.5 Catat Database URL

Setelah database dibuat, Anda akan melihat URL database di bagian atas halaman:
```
https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app/
```

**Simpan URL ini** — akan dibutuhkan di konfigurasi aplikasi.

---

## Step 3: Setup Authentication

### 3.1 Buka Authentication

1. Di sidebar kiri, klik **"Build"** → **"Authentication"**
2. Klik tombol **"Get started"**

### 3.2 Aktifkan Email/Password Provider

1. Di tab **"Sign-in method"**, klik **"Email/Password"**
2. Toggle **"Enable"** menjadi aktif (biru)
3. Opsional: aktifkan **"Email link (passwordless sign-in)"** jika dibutuhkan
4. Klik **"Save"**

### 3.3 Aktifkan Anonymous Provider

1. Kembali ke daftar sign-in method
2. Klik **"Anonymous"**
3. Toggle **"Enable"** menjadi aktif
4. Klik **"Save"**

> **Catatan:** Anonymous auth digunakan untuk pengemudi yang belum memiliki akun terdaftar namun perlu mengakses fitur tertentu.

### 3.4 Tambah Users Awal

1. Klik tab **"Users"**
2. Klik **"Add user"**
3. Tambah akun-akun berikut:

**Super Admin:**
```
Email   : admin@rifim.id
Password: [buat password kuat, minimal 12 karakter]
```

**Koordinator:**
```
Email   : koordinator@rifim.id
Password: [buat password kuat]
```

**Staff Bandara (contoh):**
```
Email   : staff.cgk@rifim.id
Password: [buat password kuat]
```

4. Setelah setiap user dibuat, catat **UID** yang muncul — akan dibutuhkan untuk set role di Realtime Database

### 3.5 Set Custom Claims untuk Role (Opsional via Firebase Admin SDK)

Jika menggunakan Firebase Admin SDK di server/Apps Script, Anda bisa set custom claims:

```javascript
// Contoh via Firebase Admin SDK (di Apps Script atau Cloud Functions)
admin.auth().setCustomUserClaims(uid, { role: 'superadmin', airport: 'all' })
```

---

## Step 4: Dapatkan Firebase Config

### 4.1 Buka Project Settings

1. Di sidebar kiri, klik ikon **gear/roda gigi** di samping "Project Overview"
2. Klik **"Project settings"**

### 4.2 Tambah Web App

1. Scroll ke bagian **"Your apps"**
2. Klik ikon **`</>`** (Web)
3. Di kolom **"App nickname"**, ketik: `RADMS`
4. Centang **"Also set up Firebase Hosting"** jika ingin (opsional untuk Vercel)
5. Klik **"Register app"**

### 4.3 Salin Firebase Config

Setelah registrasi, Firebase akan menampilkan konfigurasi seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbc123DefGhi456JklMno789",
  authDomain: "rifim-radms.firebaseapp.com",
  databaseURL: "https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rifim-radms",
  storageBucket: "rifim-radms.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

**Salin semua nilai ini** — akan dibutuhkan di file `.env`.

---

## Step 5: Install Firebase SDK

### 5.1 Install di frontend-driver

```bash
cd /path/ke/RADMS/frontend-driver
npm install firebase
```

### 5.2 Install di frontend-dashboard

```bash
cd /path/ke/RADMS/frontend-dashboard
npm install firebase
```

### 5.3 Verifikasi Instalasi

```bash
# Cek versi firebase yang terinstall
cat node_modules/firebase/package.json | grep '"version"'
# Output: "version": "11.x.x"
```

---

## Step 6: Buat File .env

### 6.1 File .env untuk frontend-driver

Buat file `.env` di folder `frontend-driver/`:

```bash
# Di terminal:
touch /path/ke/RADMS/frontend-driver/.env
```

Isi file `.env` dengan nilai dari Firebase Config yang sudah disalin:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAbc123DefGhi456JklMno789
VITE_FIREBASE_AUTH_DOMAIN=rifim-radms.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=rifim-radms
VITE_FIREBASE_STORAGE_BUCKET=rifim-radms.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Google Apps Script
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Firebase Cloud Messaging
VITE_FIREBASE_VAPID_KEY=BN_your_vapid_key_here
```

### 6.2 File .env untuk frontend-dashboard

Buat file `.env` di folder `frontend-dashboard/`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAbc123DefGhi456JklMno789
VITE_FIREBASE_AUTH_DOMAIN=rifim-radms.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=rifim-radms
VITE_FIREBASE_STORAGE_BUCKET=rifim-radms.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Apps Script
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# Firebase Cloud Messaging
VITE_FIREBASE_VAPID_KEY=BN_your_vapid_key_here
```

### 6.3 Tambahkan .env ke .gitignore

**PENTING:** Jangan commit file `.env` ke Git!

```bash
# Periksa apakah .gitignore sudah ada
cat /path/ke/RADMS/.gitignore

# Tambah .env ke .gitignore jika belum ada
echo ".env" >> /path/ke/RADMS/frontend-driver/.gitignore
echo ".env" >> /path/ke/RADMS/frontend-dashboard/.gitignore
echo ".env.local" >> /path/ke/RADMS/frontend-driver/.gitignore
echo ".env.local" >> /path/ke/RADMS/frontend-dashboard/.gitignore
```

---

## Step 7: Buat src/firebase/config.js

### 7.1 Buat Folder dan File untuk frontend-driver

```bash
mkdir -p /path/ke/RADMS/frontend-driver/src/firebase
```

Buat file `/path/ke/RADMS/frontend-driver/src/firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig)

// Inisialisasi services
export const db = getDatabase(app)
export const auth = getAuth(app)

// FCM hanya tersedia di browser yang support (bukan semua browser)
export const getMessagingInstance = async () => {
  const supported = await isSupported()
  if (supported) {
    return getMessaging(app)
  }
  console.warn('Firebase Messaging tidak didukung di browser ini')
  return null
}

export default app
```

### 7.2 Buat Folder dan File untuk frontend-dashboard

```bash
mkdir -p /path/ke/RADMS/frontend-dashboard/src/firebase
```

Buat file `/path/ke/RADMS/frontend-dashboard/src/firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig)

// Inisialisasi services
export const db = getDatabase(app)
export const auth = getAuth(app)

// Analytics (hanya di browser, bukan SSR)
export const analytics = typeof window !== 'undefined'
  ? getAnalytics(app)
  : null

// FCM hanya tersedia di browser yang support
export const getMessagingInstance = async () => {
  const supported = await isSupported()
  if (supported) {
    return getMessaging(app)
  }
  console.warn('Firebase Messaging tidak didukung di browser ini')
  return null
}

export default app
```

### 7.3 Buat Service Worker untuk FCM

Buat file `public/firebase-messaging-sw.js` di **kedua** folder frontend:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Konfigurasi firebase di service worker
// CATATAN: Nilai ini harus ditulis langsung (tidak bisa pakai import.meta.env)
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'rifim-radms.firebaseapp.com',
  databaseURL: 'https://rifim-radms-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'rifim-radms',
  storageBucket: 'rifim-radms.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
})

const messaging = firebase.messaging()

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)

  const { title, body, icon } = payload.notification || {}

  self.registration.showNotification(title || 'RADMS Notification', {
    body: body || '',
    icon: icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data,
  })
})
```

---

## Step 8: Update Security Rules

### 8.1 Buka Rules Editor

1. Di Firebase Console → **Realtime Database**
2. Klik tab **"Rules"**
3. Anda akan melihat rules default (test mode) seperti:
   ```json
   {
     "rules": {
       ".read": "now < 1752000000000",
       ".write": "now < 1752000000000"
     }
   }
   ```

### 8.2 Terapkan Security Rules dari File

Salin isi dari file `firebase.rules.json` di repository RADMS dan paste ke editor rules.

Struktur rules dasar yang direkomendasikan untuk RADMS:

```json
{
  "rules": {
    "airports": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'superadmin'"
    },
    "drivers": {
      ".read": "auth != null",
      "$driverId": {
        ".write": "auth != null && (auth.uid === $driverId || root.child('users').child(auth.uid).child('role').val() === 'superadmin' || root.child('users').child(auth.uid).child('role').val() === 'coordinator')"
      }
    },
    "queues": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "attendance": {
      ".read": "auth != null",
      "$airportCode": {
        ".write": "auth != null && (root.child('users').child(auth.uid).child('airport').val() === $airportCode || root.child('users').child(auth.uid).child('role').val() === 'superadmin')"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      },
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'superadmin'"
    },
    "notifications": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null"
      }
    }
  }
}
```

### 8.3 Publish Rules

1. Setelah mengedit rules, klik **"Publish"**
2. Firebase akan memvalidasi syntax rules sebelum menyimpan
3. Jika ada error syntax, periksa pesan error dan perbaiki

> **Penting:** Sebelum go-live, pastikan rules sudah benar. Rules yang salah bisa membuat aplikasi tidak bisa akses database atau sebaliknya membuka data ke publik.

---

## Step 9: Setup Firebase Cloud Messaging (FCM)

### 9.1 Aktifkan Cloud Messaging

1. Di Firebase Console → **Project Settings** (ikon gear)
2. Klik tab **"Cloud Messaging"**
3. Pastikan **Firebase Cloud Messaging API (V1)** dalam status **"Enabled"**

### 9.2 Generate VAPID Key

1. Masih di halaman Cloud Messaging
2. Scroll ke bagian **"Web configuration"**
3. Di bawah **"Web Push certificates"**, klik **"Generate key pair"**
4. Firebase akan generate Key Pair
5. Salin **Key pair** yang muncul (string panjang dimulai dengan `BN...`)
6. Tambahkan ke file `.env` sebagai:
   ```env
   VITE_FIREBASE_VAPID_KEY=BN_your_vapid_key_here
   ```

### 9.3 Implementasi Request Permission di Aplikasi

Tambahkan kode berikut di komponen utama aplikasi (App.jsx atau main.jsx):

```javascript
import { getToken } from 'firebase/messaging'
import { getMessagingInstance } from './firebase/config'

const requestNotificationPermission = async () => {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      })
      console.log('FCM Token:', token)
      // Simpan token ke Realtime Database untuk kirim notifikasi ke user ini
      // await saveTokenToDatabase(token)
    }
  } catch (error) {
    console.error('Error mendapatkan FCM token:', error)
  }
}
```

---

## Step 10: Setup Google Apps Script sebagai Backend

### 10.1 Buka Google Apps Script

1. Buka browser dan kunjungi **https://script.google.com**
2. Login dengan akun Google yang sama dengan Firebase project
3. Klik **"New project"**

### 10.2 Buat Project Baru

1. Klik judul project di bagian atas (default: "Untitled project")
2. Ubah nama menjadi: `RADMS Backend`
3. Klik **"OK"**

### 10.3 Salin Kode dari Repository

1. Di folder `apps-script/` pada repository RADMS, terdapat file-file script
2. Di Google Apps Script editor, hapus kode default di file `Code.gs`
3. Salin isi setiap file dari folder `apps-script/` ke editor:
   - Untuk file baru: klik ikon **"+"** di sidebar → **"Script"** → beri nama sesuai file di repository
   - Salin isi file ke editor

### 10.4 Deploy sebagai Web App

1. Di toolbar atas, klik **"Deploy"** → **"New deployment"**
2. Klik ikon gear di samping **"Select type"** → pilih **"Web app"**
3. Isi konfigurasi:
   ```
   Description        : RADMS Backend v1.0
   Execute as         : Me (your.email@gmail.com)
   Who has access     : Anyone
   ```
4. Klik **"Deploy"**
5. Jika diminta otorisasi: klik **"Authorize access"** → pilih akun Google → klik **"Allow"**
6. Salin **Web app URL** yang muncul:
   ```
   https://script.google.com/macros/s/AKfycbXXXXXXXXXX/exec
   ```
7. Tambahkan URL ini ke file `.env` sebagai:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbXXXXXXXXXX/exec
   ```

### 10.5 Update Deployment

Setiap kali ada perubahan kode di Apps Script, buat deployment baru:

1. **Deploy** → **Manage deployments**
2. Klik ikon pensil (edit) pada deployment aktif
3. Di **"Version"**, pilih **"New version"**
4. Klik **"Deploy"**
5. **Catatan:** URL deployment TIDAK berubah saat update versi

---

## Step 11: Inisialisasi Data Awal di Firebase

### 11.1 Buka Database Editor

1. Firebase Console → **Realtime Database**
2. Klik tab **"Data"**
3. Klik ikon **"+"** atau klik tiga titik (...) → **"Import JSON"**

### 11.2 Struktur Data Awal

Import JSON berikut sebagai data awal RADMS:

```json
{
  "airports": {
    "CGK": {
      "name": "Soekarno-Hatta International Airport",
      "code": "CGK",
      "city": "Tangerang",
      "province": "Banten",
      "terminals": ["T1A", "T1B", "T1C", "T2D", "T2E", "T2F", "T3"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "SUB": {
      "name": "Juanda International Airport",
      "code": "SUB",
      "city": "Surabaya",
      "province": "Jawa Timur",
      "terminals": ["T1", "T2"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "DPS": {
      "name": "Ngurah Rai International Airport",
      "code": "DPS",
      "city": "Denpasar",
      "province": "Bali",
      "terminals": ["Domestik", "Internasional"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "drivers": {
    "driver_001": {
      "name": "Budi Santoso",
      "employeeId": "DRV-001",
      "airport": "CGK",
      "licenseNumber": "SIM-A-123456",
      "phoneNumber": "+6281234567890",
      "status": "available",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "driver_002": {
      "name": "Agus Wijaya",
      "employeeId": "DRV-002",
      "airport": "CGK",
      "licenseNumber": "SIM-A-654321",
      "phoneNumber": "+6281234567891",
      "status": "available",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "driver_003": {
      "name": "Sari Dewi",
      "employeeId": "DRV-003",
      "airport": "SUB",
      "licenseNumber": "SIM-A-789012",
      "phoneNumber": "+6281234567892",
      "status": "available",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "queues": {
    "CGK": {
      "currentQueue": 0,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "SUB": {
      "currentQueue": 0,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "DPS": {
      "currentQueue": 0,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  },
  "settings": {
    "appVersion": "1.0.0",
    "maintenanceMode": false,
    "maxQueuePerAirport": 50
  }
}
```

### 11.3 Import JSON

1. Di Realtime Database, klik ikon tiga titik (**⋮**) di pojok kanan atas
2. Klik **"Import JSON"**
3. Klik **"Browse"** dan pilih file JSON yang sudah dibuat
4. Klik **"Import"**
5. Data akan muncul di tree view database

---

## Step 12: Setup Google Sheets

### 12.1 Buat Google Spreadsheet Baru

1. Buka **https://sheets.google.com**
2. Klik **"+"** untuk membuat spreadsheet baru
3. Ubah nama spreadsheet: `RADMS - Data Management`

### 12.2 Buat Sheet-sheet yang Diperlukan

Di bagian bawah spreadsheet, buat sheet dengan nama berikut (klik **"+"** untuk tambah sheet baru):

| Nama Sheet | Fungsi |
|-----------|--------|
| `DRIVERS` | Data pengemudi |
| `STAFF` | Data staff dan koordinator |
| `ATTENDANCE` | Rekap absensi harian |
| `QUEUE_HISTORY` | Riwayat antrian |
| `TRACKING_LOG` | Log tracking perjalanan |
| `AIRPORTS` | Data bandara |
| `KPI` | Key Performance Indicators |
| `REPORTS` | Laporan bulanan/tahunan |

### 12.3 Setup Header Kolom untuk Setiap Sheet

**Sheet DRIVERS:**
```
A: Employee ID | B: Nama | C: Bandara | D: No SIM | E: No Telepon | F: Status | G: Tanggal Bergabung | H: Aktif
```

**Sheet ATTENDANCE:**
```
A: Tanggal | B: Employee ID | C: Nama | D: Bandara | E: Jam Masuk | F: Jam Keluar | G: Status | H: Keterangan
```

**Sheet QUEUE_HISTORY:**
```
A: Timestamp | B: Bandara | C: Driver ID | D: Nama Driver | E: Terminal | F: Tujuan | G: Status | H: Durasi
```

### 12.4 Atur Sharing Permission

1. Klik tombol **"Share"** di pojok kanan atas
2. Di bagian **"General access"**, klik dropdown **"Restricted"**
3. Pilih **"Anyone with the link"**
4. Set permission ke **"Viewer"** (bukan Editor)
5. Klik **"Copy link"** dan simpan link tersebut

### 12.5 Dapatkan Spreadsheet ID

Dari URL spreadsheet yang terbuka:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
```

Spreadsheet ID adalah bagian antara `/d/` dan `/edit`:
```
1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

### 12.6 Update SHEET_IDS di Konfigurasi

Buka file `src/config/airportConfig.js` di repository RADMS dan update Spreadsheet ID:

```javascript
export const SHEET_CONFIG = {
  SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
  SHEETS: {
    DRIVERS: 'DRIVERS',
    STAFF: 'STAFF',
    ATTENDANCE: 'ATTENDANCE',
    QUEUE_HISTORY: 'QUEUE_HISTORY',
    TRACKING_LOG: 'TRACKING_LOG',
    AIRPORTS: 'AIRPORTS',
    KPI: 'KPI',
    REPORTS: 'REPORTS',
  }
}
```

---

## Troubleshooting

### Error: CORS Policy Blocked

**Gejala:**
```
Access to XMLHttpRequest at 'https://script.google.com/...' from origin 'https://...' 
has been blocked by CORS policy
```

**Penyebab:** Apps Script deployment tidak mengizinkan request dari domain tersebut.

**Solusi:**
1. Pastikan deployment Apps Script diset ke **"Who has access: Anyone"**
2. Pastikan fungsi di Apps Script mengembalikan header CORS yang tepat:

```javascript
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  // Tambahkan ini di setiap response
  const output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  // ... proses request ...
  return output
}
```

3. Jika masih error, buat deployment **baru** (bukan update yang lama) dan gunakan URL baru

---

### Error: Permission Denied di Realtime Database

**Gejala:**
```
FIREBASE WARNING: set at /path failed: permission_denied
```

**Penyebab:** Security rules tidak mengizinkan operasi tersebut untuk user yang sedang login.

**Solusi:**

1. **Cek apakah user sudah login:**
```javascript
import { getAuth } from 'firebase/auth'
const auth = getAuth()
console.log('Current user:', auth.currentUser)
```

2. **Cek rules di Firebase Console:**
   - Realtime Database → Rules → Simulator
   - Test operasi yang gagal dengan mengisi: Simulation type, Location, Auth, dan Data

3. **Sementara untuk debugging** (JANGAN di production!):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

### Error: Database URL Format Salah

**Gejala:**
```
Firebase: Error (auth/invalid-api-key)
atau
Database URL tidak valid
```

**Penyebab:** Format URL database salah.

**Format yang benar untuk region asia-southeast1:**
```
https://[PROJECT-ID]-default-rtdb.asia-southeast1.firebasedatabase.app
```

**Format yang SALAH (jangan gunakan ini):**
```
https://[PROJECT-ID].firebaseio.com  ← format lama, tidak untuk region Asia
```

**Cara cek URL yang benar:**
1. Firebase Console → Realtime Database
2. URL database tertera di bagian atas halaman

---

### Error: FCM Tidak Bekerja di Localhost

**Gejala:** Push notifications tidak muncul saat development di localhost.

**Penyebab:** Service Workers membutuhkan HTTPS, kecuali di localhost beberapa browser mengizinkan HTTP.

**Solusi:**

1. **Gunakan localhost (bukan 127.0.0.1):**
   - Akses via `http://localhost:5173` bukan `http://127.0.0.1:5173`

2. **Pastikan `firebase-messaging-sw.js` ada di folder `public/`**

3. **Cek di Chrome DevTools:**
   - Application → Service Workers → Pastikan SW terdaftar
   - Application → Storage → Hapus semua storage, lalu refresh

4. **Cek permission browser:**
   - Chrome: klik ikon gembok/info di address bar → Notifications → Allow

5. **Gunakan HTTPS di development** dengan Vite:
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    https: true,
    port: 5173,
  }
})
```

---

### Error: "Firebase App named '[DEFAULT]' already exists"

**Gejala:**
```
FirebaseError: Firebase: Firebase App named '[DEFAULT]' already exists (app/duplicate-app).
```

**Penyebab:** `initializeApp()` dipanggil lebih dari sekali.

**Solusi:** Update `firebase/config.js` untuk cek apakah app sudah diinisialisasi:

```javascript
import { initializeApp, getApps, getApp } from 'firebase/app'

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp()
```

---

### Error: Apps Script tidak merespons atau timeout

**Gejala:** Request ke Apps Script URL tidak mendapat response atau timeout setelah 30 detik.

**Penyebab:** Kode Apps Script memiliki bug atau operasi yang terlalu lama.

**Solusi:**

1. **Test langsung di Apps Script Editor:**
   - Buka editor → klik fungsi yang bermasalah → klik "Run"
   - Cek "Execution log" di bawah editor

2. **Cek Execution History:**
   - Di Apps Script editor, klik ikon jam (Executions) di sidebar kiri
   - Lihat log eksekusi terakhir

3. **Buat deployment baru** setelah perbaikan:
   - Deploy → New deployment → pilih "New version"

---

## Checklist Setup Firebase

Gunakan checklist ini untuk memastikan semua sudah dikonfigurasi:

- [ ] Firebase project `rifim-radms` sudah dibuat
- [ ] Realtime Database sudah dibuat dengan region `asia-southeast1`
- [ ] Authentication sudah diaktifkan (Email/Password + Anonymous)
- [ ] User awal (admin, koordinator, staff) sudah dibuat
- [ ] Firebase Config sudah disalin dari Project Settings
- [ ] Firebase SDK sudah diinstall di kedua frontend
- [ ] File `.env` sudah dibuat untuk kedua frontend
- [ ] File `.env` sudah ditambahkan ke `.gitignore`
- [ ] `src/firebase/config.js` sudah dibuat untuk kedua frontend
- [ ] `public/firebase-messaging-sw.js` sudah dibuat
- [ ] Security Rules sudah diupdate dari test mode
- [ ] VAPID key sudah digenerate dan ditambahkan ke `.env`
- [ ] Google Apps Script sudah di-deploy dan URL sudah tersimpan di `.env`
- [ ] Data awal (airports, drivers) sudah diimport ke Realtime Database
- [ ] Google Sheets sudah dibuat dengan sheet-sheet yang diperlukan
- [ ] Spreadsheet ID sudah diupdate di `airportConfig.js`

---

*Panduan ini berlaku untuk RADMS versi terkini. Untuk pertanyaan lebih lanjut, hubungi tim developer RADMS.*

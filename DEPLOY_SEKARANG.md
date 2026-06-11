# PANDUAN DEPLOY RADMS - JALANKAN DI PC WINDOWS ANDA

> Semua perintah di bawah dijalankan di CMD atau PowerShell di PC Anda (bukan di server ini).

---

## PERSIAPAN AWAL

1. **Clone atau pull repo terbaru:**
   ```bash
   git clone https://github.com/rifim01/radms.git RADMS
   cd RADMS
   ```
   atau jika sudah ada:
   ```bash
   cd RADMS
   git pull origin claude/blissful-lamport-xlnc5i
   ```

2. **Install semua dependencies:**
   ```bash
   cd frontend-dashboard && npm install && cd ..
   cd frontend-driver && npm install && cd ..
   ```

---

## STEP 1 — GOOGLE APPS SCRIPT

### 1.1 Login clasp
```bash
cd apps-script
npx @google/clasp login
```
Browser akan terbuka → login dengan akun Google Anda → Allow.

### 1.2 Buat project Apps Script baru
```bash
npx @google/clasp create --title "RADMS Backend" --type standalone
```
Output akan menampilkan URL seperti:
```
Created new standalone script: https://script.google.com/d/XXXXXXXXXX/edit
```
**Salin Script ID** (bagian `XXXXXXXXXX`) — akan digunakan di Step 1.4.

### 1.3 Push kode ke Apps Script
```bash
npx @google/clasp push
```
Ketik `y` jika ada pertanyaan overwrite.

### 1.4 Update .clasp.json dengan Script ID Anda
Edit file `apps-script/.clasp.json`:
```json
{
  "scriptId": "SCRIPT_ID_YANG_DISALIN_TADI",
  "rootDir": ".",
  "projectId": "PROJECT_ID_FIREBASE_ANDA"
}
```

### 1.5 Deploy sebagai Web App
```bash
npx @google/clasp open
```
Di browser:
1. Klik **Deploy** → **New deployment**
2. Pilih type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Klik **Deploy**
6. **Salin Web App URL** → akan dipakai di `.env` sebagai `VITE_APPS_SCRIPT_URL`

---

## STEP 2 — FIREBASE

### 2.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2.2 Login Firebase
```bash
firebase login
```
Browser terbuka → login dengan akun Google → Allow.

### 2.3 Buat project Firebase (jika belum ada)
1. Buka https://console.firebase.google.com
2. Klik **Add project** → nama: `radms-rifim`
3. Enable Google Analytics (opsional)
4. Setelah dibuat, buka **Project Settings** → salin **Project ID**

### 2.4 Aktifkan Realtime Database
1. Di Firebase Console → **Realtime Database** → **Create database**
2. Pilih region: **asia-southeast1 (Singapore)**
3. Start in **test mode** (bisa diperketat nanti)

### 2.5 Aktifkan Authentication
1. Firebase Console → **Authentication** → **Get started**
2. Enable **Email/Password**

### 2.6 Aktifkan Cloud Messaging (FCM)
1. Firebase Console → **Project Settings** → tab **Cloud Messaging**
2. Salin **Server key** (untuk VAPID key di PWA)
3. Di tab **Web Push certificates** → **Generate key pair** → salin public key

### 2.7 Ambil konfigurasi Firebase
1. Firebase Console → **Project Settings** → scroll ke **Your apps**
2. Klik **</>** (Web app) → nama: `radms-web` → Register app
3. Salin konfigurasi `firebaseConfig`:
   ```js
   apiKey: "AIza..."
   authDomain: "radms-rifim.firebaseapp.com"
   databaseURL: "https://radms-rifim-default-rtdb.asia-southeast1.firebasedatabase.app"
   projectId: "radms-rifim"
   storageBucket: "radms-rifim.appspot.com"
   messagingSenderId: "123456789"
   appId: "1:123456789:web:abc123"
   ```

### 2.8 Buat file .env untuk kedua app

**`frontend-dashboard/.env`:**
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=radms-rifim.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://radms-rifim-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=radms-rifim
VITE_FIREBASE_STORAGE_BUCKET=radms-rifim.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_KEY=BK...your-vapid-key...
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

**`frontend-driver/.env`** → isi sama persis dengan dashboard.

---

## STEP 3 — VERCEL (Dashboard Staff)

### 3.1 Login Vercel
```bash
cd frontend-dashboard
npx vercel login
```
Pilih login method → browser terbuka → authorize.

### 3.2 Deploy
```bash
npx vercel --prod
```
Jawab pertanyaan:
- Set up and deploy? → **Y**
- Which scope? → pilih akun Anda
- Link to existing project? → **N**
- Project name? → `radms-dashboard`
- Directory? → `.` (current)
- Override settings? → **N**

Setelah selesai, Vercel akan memberikan URL seperti:
`https://radms-dashboard.vercel.app`

### 3.3 Set Environment Variables di Vercel
```bash
npx vercel env add VITE_FIREBASE_API_KEY production
# (masukkan value saat diminta)
# Ulangi untuk semua VITE_* variables
```

Atau via Vercel Dashboard:
1. Buka https://vercel.com → project `radms-dashboard`
2. **Settings** → **Environment Variables**
3. Tambahkan semua variabel dari `.env`

### 3.4 Redeploy setelah set env vars
```bash
npx vercel --prod
```

---

## STEP 4 — VERCEL (Driver App)

```bash
cd ../frontend-driver
npx vercel --prod
```
- Project name: `radms-driver`
- Jawab sama seperti Step 3.2

Set env vars sama seperti Step 3.3, lalu redeploy.

URL akhir: `https://radms-driver.vercel.app`

---

## STEP 5 — UPDATE FIRESTORE RULES (Opsional tapi Penting)

Di Firebase Console → **Realtime Database** → **Rules**:
```json
{
  "rules": {
    "queue": {
      ".read": true,
      ".write": "auth != null"
    },
    "drivers": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## RINGKASAN URL YANG AKAN DIDAPAT

| Service | URL |
|---------|-----|
| Dashboard Staff | `https://radms-dashboard.vercel.app` |
| Driver App | `https://radms-driver.vercel.app` |
| Apps Script API | `https://script.google.com/macros/s/XXXX/exec` |
| Firebase Console | `https://console.firebase.google.com/project/radms-rifim` |

---

## TROUBLESHOOTING

**Error: `clasp: command not found`**
```bash
npm install -g @google/clasp
```

**Error: `vercel: command not found`**
```bash
npm install -g vercel
```

**Error Vercel: "framework not detected"**
- Pastikan ada `vercel.json` di root folder project (sudah ada di repo)

**Error build: "Cannot find module"**
```bash
npm install
npm run build
```

**Firebase CORS error di browser**
- Pastikan `VITE_APPS_SCRIPT_URL` benar dan Apps Script sudah di-deploy sebagai Web App dengan akses "Anyone"

# RIFIM PAYROLL — PANDUAN SETUP

## LANGKAH 1 — Buat Google Sheets Database

1. Buka [sheets.google.com](https://sheets.google.com)
2. Buat spreadsheet baru, beri nama: **RIFIM ERP PAYROLL**
3. Buat sheet-sheet berikut dengan header tepat seperti ini:

### Sheet: STAFF
```
id | nama | email | password_hash | role | id_cabang | jabatan | gapok | nomor_hp | foto | status | created_at
```

### Sheet: ABSENSI
```
id | timestamp | tanggal | id_staff | nama | id_cabang | status | lat | lng | method
```

### Sheet: PAYROLL
```
id | periode | id_cabang | total_staff | total_gaji_kotor | total_potongan | total_gaji_bersih | status | generated_by | generated_at | pdf_url
```

### Sheet: PAYROLL_DETAIL
```
id | payroll_id | periode | id_staff | nama | jabatan | id_cabang | gapok | bpjs | data_pulsa | bonus_target | total_lembur | kasbon | potongan_alpha | denda_telat | gaji_kotor | total_potongan | gaji_bersih | status | slip_pdf_url
```

### Sheet: LEMBUR
```
id | id_staff | nama | id_cabang | tanggal | jam_masuk | jam_keluar | jam_normal | jam_lembur | gapok | tarif_lembur | total_lembur | keterangan | approved_by | status | created_at | periode
```

### Sheet: KASBON
```
id | id_staff | nama | id_cabang | tanggal | jumlah | keterangan | periode_potong | status | created_at
```

### Sheet: CUTI
```
id | id_staff | nama | id_cabang | jenis_cuti | tanggal_mulai | tanggal_selesai | jumlah_hari | keterangan | status | approved_by | alasan_tolak | created_at
```

### Sheet: PR_TOKENS
```
token | user_id | role | id_cabang | created_at | expires_at | revoked
```

---

## LANGKAH 2 — Setup Google Apps Script

1. Buka [script.google.com](https://script.google.com)
2. Klik **New Project**
3. Beri nama: **RIFIM Payroll API**
4. Copy semua file `.gs` dari folder `apps-script/` ke project ini:
   - `Code.gs` (ganti isi default)
   - Tambah file baru: `Auth.gs`, `Staff.gs`, `Attendance.gs`, `Payroll.gs`, `Leave.gs`, `PDF.gs`, `Report.gs`

5. Di menu **Project Settings** → **Script Properties**, tambahkan:
   ```
   PAYROLL_SPREADSHEET_ID  = [ID spreadsheet dari langkah 1]
   TOKEN_SECRET            = [string random minimal 32 karakter]
   ```

   > Cara ambil Spreadsheet ID: dari URL sheets.google.com/spreadsheets/d/**INI_ID_NYA**/edit

6. **Deploy sebagai Web App:**
   - Klik **Deploy** → **New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**
   - **Salin URL deployment** (bentuk: https://script.google.com/macros/s/XXX/exec)

7. **Buat akun Owner pertama:**
   - Di Apps Script Editor, jalankan fungsi `setupOwnerAccount()`
   - Login: `owner@rifimgemilang.com` / `Rifim@2024!`
   - **Segera ganti password setelah login pertama**

---

## LANGKAH 3 — Konfigurasi Frontend

1. Buka file `frontend/js/config.js`
2. Ganti baris:
   ```js
   GAS_URL: 'GANTI_DENGAN_URL_APPS_SCRIPT_KAMU',
   ```
   Dengan URL dari langkah 2:
   ```js
   GAS_URL: 'https://script.google.com/macros/s/XXX/exec',
   ```

---

## LANGKAH 4 — Deploy ke GitHub Pages (Gratis)

```bash
# Di root RADMS repo
git add payroll/
git commit -m "feat: tambah RIFIM Payroll System"
git push origin main
```

Kemudian di GitHub:
1. **Settings** → **Pages**
2. Source: **Deploy from branch** → `main` → folder `/root`
3. URL aplikasi: `https://[username].github.io/RADMS/payroll/frontend/`

---

## LANGKAH 5 — Deploy ke Vercel (Gratis, lebih cepat)

```bash
# Sudah ada vercel.json di root, tinggal push
git push origin main
```

Vercel auto-deploy. URL: `https://rifim-payroll.vercel.app/payroll/frontend/`

---

## AKUN DEFAULT

| Email | Password | Role |
|-------|----------|------|
| owner@rifimgemilang.com | Rifim@2024! | Owner |

> Setelah login pertama, buat akun Admin Cabang via menu Staff → Tambah Staff

---

## STRUKTUR ROLE

| Role | Akses |
|------|-------|
| **OWNER** | Akses penuh semua cabang |
| **SUPER_ADMIN** | Kelola semua cabang, tidak bisa ubah owner |
| **ADMIN_CABANG** | Kelola cabang sendiri saja |
| **STAFF** | Lihat data sendiri |

---

## FORMULA PAYROLL

```
Gaji Kotor  = Gapok + BPJS(55rb) + Data(100rb) + Bonus + Lembur
Potongan    = Kasbon + (Gapok/26 × Hari Alpha) + Denda Telat
Gaji Bersih = Gaji Kotor − Potongan
Lembur/jam  = Gapok ÷ 173 (standar Depnaker)
Lembur Full = Gapok ÷ 26
```

---

## TROUBLESHOOTING

**"URL Apps Script belum dikonfigurasi"**
→ Edit `js/config.js`, isi `GAS_URL`

**CORS Error saat login**
→ Pastikan Web App di-deploy dengan access "Anyone" bukan "Anyone with Google account"

**"Sheet tidak ditemukan"**
→ Pastikan nama sheet persis sama (case-sensitive) dengan yang ada di `Code.gs`

**Token expired setiap 8 jam**
→ Normal. User akan diminta login ulang otomatis

/**
 * Catat aktivitas staff ke sheet JADWAL KERJA via Apps Script.
 * Dipanggil saat staff: panggil driver (CALLED) atau selesaikan antrian.
 * Satu baris per (Nama, Cabang, Shift, Tanggal) — deduplikasi di server.
 */

// Apps Script URL — public endpoint, tidak perlu disembunyikan
const APPS_SCRIPT_URL =
  import.meta.env.VITE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbxIzRRCti8rNHZiBEuOCzMhTKSiIAAMkRU7kVNCkdKOQoT4zcY5Gsn4sYFy-O2Ngj3g8A/exec'

function getShift() {
  const h = new Date().getHours()
  if (h < 10) return 'PAGI'
  if (h < 14) return 'MIDDLE'
  return 'SIANG'
}

function getToday() {
  return new Date().toISOString().substring(0, 10)
}

export async function logJadwalKerja(user) {
  if (!APPS_SCRIPT_URL || !user?.name) return
  try {
    // Content-Type: text/plain menghindari CORS preflight pada Apps Script
    await fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action:  'logJadwalKerja',
        nama:    user.name,
        cabang:  user.airportId || '',
        jabatan: user.jabatan || user.role || '',
        shift:   getShift(),
        tanggal: getToday(),
      }),
    })
  } catch {
    // Silent fail — pencatatan jadwal tidak boleh blokir UI
  }
}

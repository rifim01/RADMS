import { AIRPORT_BRANCHES, SHIFT_WINDOWS, SHEET_IDS } from './airportConfig'

// ---------------------------------------------------------------------------
// GVIZ fetch & parse
// ---------------------------------------------------------------------------

export async function fetchAttendanceData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_IDS.ABSENSI}/gviz/tq?tqx=out:json&sheet=ABSENSI`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP error ${response.status}`)
  const rawText = await response.text()
  return parseGvizResponse(rawText)
}

export function parseGvizResponse(rawText) {
  // Strip /*O_o*/ prefix and google.visualization.Query.setResponse(...) wrapper
  const jsonStart = rawText.indexOf('{')
  const jsonEnd = rawText.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('Invalid GVIZ response')
  const jsonStr = rawText.substring(jsonStart, jsonEnd + 1)
  const data = JSON.parse(jsonStr)

  const rows = data?.table?.rows ?? []
  const records = []

  for (const row of rows) {
    if (!row.c) continue
    const cells = row.c

    const timestamp = cells[0]?.v ?? null
    const nama      = cells[1]?.v ?? ''
    const idCabang  = cells[2]?.v ?? ''
    const status    = cells[3]?.v ?? ''

    if (!timestamp || !nama) continue

    // Parse timestamp: "6/10/2026 7:02:15" or Google Date format
    let parsedDate = null
    let timeStr = null

    if (typeof timestamp === 'string') {
      // "M/D/YYYY H:MM:SS"
      const match = timestamp.match(/(\d+)\/(\d+)\/(\d{4})\s+(\d+):(\d+)(?::(\d+))?/)
      if (match) {
        const [, month, day, year, hours, minutes] = match
        parsedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
    } else if (typeof timestamp === 'object' && timestamp !== null) {
      // Google Date(year,month,day,h,m,s) — months are 0-based
      const d = new Date(timestamp)
      parsedDate = d.toISOString().slice(0, 10)
      timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    if (!parsedDate || !timeStr) continue

    records.push({ timestamp, date: parsedDate, time: timeStr, nama, idCabang, status })
  }

  return records
}

// ---------------------------------------------------------------------------
// Status determination
// ---------------------------------------------------------------------------

function timeToMins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function isBatamBranch(branchId) {
  return branchId === 'ID Rifim Airport Batam' || branchId === 'ID Rifim Batam'
}

export function determineAttendanceStatus(timeStr, branchId) {
  const branch = AIRPORT_BRANCHES[branchId]
  const isWITA = branch?.tz === 'WITA'
  const isExempt = branch?.deductionExempt ?? false
  const isBatam = isBatamBranch(branchId)

  // For WITA branches: local time is 1 hour ahead of WIB.
  // Shift windows are defined in WIB terms, so to compare we subtract 60 mins
  // to convert WITA local time → WIB equivalent.
  let totalMins = timeToMins(timeStr)
  if (isWITA) totalMins -= 60

  // Build list of windows to check (Batam uses SIANG_BATAM instead of SIANG)
  const shiftKeys = isBatam
    ? ['PAGI', 'MIDDLE', 'SIANG_BATAM']
    : ['PAGI', 'MIDDLE', 'SIANG']

  for (const key of shiftKeys) {
    const w = SHIFT_WINDOWS[key]
    const start     = timeToMins(w.start)
    const windowEnd = timeToMins(w.windowEnd)
    const lateStart = timeToMins(w.lateStart)
    const lateEnd   = timeToMins(w.lateEnd)

    if (totalMins >= start && totalMins <= windowEnd) {
      return {
        status: 'Hadir',
        shift: w.label,
        minutesLate: 0,
        deduction: 0,
      }
    }

    if (totalMins >= lateStart && totalMins <= lateEnd) {
      const minutesLate = totalMins - timeToMins(w.start)
      const deduction = isExempt ? 0 : calculateDeduction(minutesLate, branchId)
      return {
        status: 'Terlambat',
        shift: w.label,
        minutesLate,
        deduction,
      }
    }
  }

  return { status: 'Khusus', shift: '-', minutesLate: 0, deduction: 0 }
}

export function calculateDeduction(minutesLate, branchId) {
  const branch = AIRPORT_BRANCHES[branchId]
  if (branch?.deductionExempt) return 0
  // Simple tiered deduction (adjust as needed)
  if (minutesLate <= 5)  return 0
  if (minutesLate <= 15) return 25000
  if (minutesLate <= 30) return 50000
  return 100000
}

// ---------------------------------------------------------------------------
// Process raw records
// ---------------------------------------------------------------------------

export function processAttendanceRecords(rawData) {
  const map = {}

  for (const rec of rawData) {
    const key = `${rec.nama}__${rec.date}`
    if (!map[key]) {
      map[key] = { nama: rec.nama, idCabang: rec.idCabang, date: rec.date, masuk: null, pulang: null }
    }
    if (rec.status === 'Masuk' && !map[key].masuk) {
      map[key].masuk = rec.time
    } else if (rec.status === 'Pulang' && !map[key].pulang) {
      map[key].pulang = rec.time
    }
  }

  return Object.values(map).map(entry => {
    const statusInfo = entry.masuk
      ? determineAttendanceStatus(entry.masuk, entry.idCabang)
      : { status: 'Tidak Hadir', shift: '-', minutesLate: 0, deduction: 0 }

    return { ...entry, ...statusInfo }
  })
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

export function getLast7DaysData(records, branchId) {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - 6)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return records.filter(r => {
    const matchBranch = !branchId || r.idCabang === branchId
    const matchDate = r.date >= cutoffStr
    return matchBranch && matchDate
  })
}

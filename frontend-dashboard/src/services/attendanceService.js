import { AIRPORT_BRANCHES, SHIFT_WINDOWS, SHEET_IDS } from './airportConfig'

// ---------------------------------------------------------------------------
// ABSENSI sheet columns (RIFIM ERP ABSENSI):
// A=Timestamp  B=Nama Staff  C=Bandara  D=Tipe Absen (masuk/pulang/khusus)
// E=Koordinat GPS  F=Status Jarak  G=Bukti Foto
// ---------------------------------------------------------------------------

export async function fetchAttendanceData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_IDS.ABSENSI}/gviz/tq?tqx=out:json&sheet=ABSENSI`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP error ${response.status}`)
  const rawText = await response.text()
  return parseGvizResponse(rawText)
}

export function parseGvizResponse(rawText) {
  const jsonStart = rawText.indexOf('{')
  const jsonEnd   = rawText.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('Invalid GVIZ response')
  const data = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1))

  const rows = data?.table?.rows ?? []
  const records = []

  for (const row of rows) {
    if (!row.c) continue
    const c = row.c

    const rawTs      = c[0]?.v ?? null
    const nama       = String(c[1]?.v ?? '').trim()
    const bandara    = String(c[2]?.v ?? '').trim()
    const tipeAbsen  = String(c[3]?.v ?? '').trim().toLowerCase() // masuk / pulang / khusus
    const koordinat  = String(c[4]?.v ?? '').trim()
    const statusJarak = String(c[5]?.v ?? '').trim()             // Dalam Radius / Di Luar Radius
    const buktiFoto  = String(c[6]?.v ?? '').trim()

    if (!rawTs || !nama) continue

    const { date: parsedDate, time: timeStr } = parseTimestamp(rawTs)
    if (!parsedDate || !timeStr) continue

    // Parse GPS coords  "lat,lng"
    let lat = null, lng = null
    const coords = koordinat.split(',')
    if (coords.length === 2) {
      lat = parseFloat(coords[0])
      lng = parseFloat(coords[1])
    }

    const dalamRadius = statusJarak.toLowerCase().startsWith('dalam radius')

    records.push({
      timestamp: rawTs,
      date: parsedDate,
      time: timeStr,
      nama,
      bandara,        // "ID Rifim Airport Batam" etc.
      tipeAbsen,      // "masuk" | "pulang" | "khusus"
      koordinat,
      lat,
      lng,
      dalamRadius,
      statusJarak,
      buktiFoto,
    })
  }

  return records
}

function parseTimestamp(raw) {
  // Format from sheet: "7/6/2026, 19.02.42" or "M/D/YYYY, HH.MM.SS"
  if (typeof raw === 'string') {
    // Try "D/M/YYYY, HH.MM.SS" (Indonesian format with dot separators)
    let m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2})\.(\d{2})/)
    if (m) {
      const [, day, month, year, hours, minutes] = m
      return {
        date: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
        time: `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`,
      }
    }
    // Try "M/D/YYYY H:MM" (US format)
    m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
    if (m) {
      const [, month, day, year, hours, minutes] = m
      return {
        date: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
        time: `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`,
      }
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    const d = new Date(raw)
    return {
      date: d.toISOString().slice(0, 10),
      time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
    }
  }
  return { date: null, time: null }
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
  const branch   = AIRPORT_BRANCHES[branchId]
  const isWITA   = branch?.tz === 'WITA'
  const isExempt = branch?.deductionExempt ?? false
  const isBatam  = isBatamBranch(branchId)

  let totalMins = timeToMins(timeStr)
  if (isWITA) totalMins -= 60 // convert WITA → WIB for comparison

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
      return { status: 'Hadir', shift: w.label, minutesLate: 0, deduction: 0 }
    }
    if (totalMins >= lateStart && totalMins <= lateEnd) {
      const minutesLate = totalMins - start
      return {
        status: 'Terlambat',
        shift: w.label,
        minutesLate,
        deduction: isExempt ? 0 : calculateDeduction(minutesLate),
      }
    }
  }

  return { status: 'Khusus', shift: '-', minutesLate: 0, deduction: 0 }
}

export function calculateDeduction(minutesLate) {
  if (minutesLate <= 5)  return 0
  if (minutesLate <= 15) return 25000
  if (minutesLate <= 30) return 50000
  return 100000
}

// ---------------------------------------------------------------------------
// Process: group by (nama + date), pair masuk/pulang, compute status
// ---------------------------------------------------------------------------

export function processAttendanceRecords(rawData) {
  const map = {}

  for (const rec of rawData) {
    const key = `${rec.nama}__${rec.date}`
    if (!map[key]) {
      map[key] = {
        nama:       rec.nama,
        bandara:    rec.bandara,
        date:       rec.date,
        masuk:      null,
        pulang:     null,
        khusus:     null,
        dalamRadius: rec.dalamRadius,
        buktiFoto:  rec.buktiFoto,
        koordinat:  rec.koordinat,
      }
    }
    const entry = map[key]
    if (rec.tipeAbsen === 'masuk'  && !entry.masuk)  entry.masuk  = rec.time
    if (rec.tipeAbsen === 'pulang' && !entry.pulang) entry.pulang = rec.time
    if (rec.tipeAbsen === 'khusus' && !entry.khusus) entry.khusus = rec.time
    // update radius from latest record
    if (!entry.dalamRadius) entry.dalamRadius = rec.dalamRadius
    entry.buktiFoto = rec.buktiFoto || entry.buktiFoto
  }

  return Object.values(map).map(entry => {
    const checkInTime = entry.masuk || entry.khusus
    const statusInfo  = checkInTime
      ? determineAttendanceStatus(checkInTime, entry.bandara)
      : { status: 'Tidak Hadir', shift: '-', minutesLate: 0, deduction: 0 }

    // Override: if outside radius → flag it
    if (!entry.dalamRadius && statusInfo.status === 'Hadir') {
      statusInfo.status = 'Di Luar Radius'
    }

    return { ...entry, ...statusInfo }
  })
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

export function getLast7DaysData(records, branchId) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 6)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return records.filter(r => {
    const matchBranch = !branchId || r.bandara === branchId
    const matchDate   = r.date >= cutoffStr
    return matchBranch && matchDate
  })
}

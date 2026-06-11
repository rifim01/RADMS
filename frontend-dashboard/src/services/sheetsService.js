/**
 * Google Sheets data service
 * Fetches Driver, Staff, and Attendance data from Google Sheets via GVIZ API
 * Falls back to mock data if sheets are not publicly accessible
 */

export const SHEET_IDS = {
  DRIVER_EXTERNAL: '1suoDC-RsWOgTHiLq4max6iIsWe39Ou-RMddRXl5DVJc',
  DRIVER_AIRPORT:  '1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_Tlc',
  DATABASE_STAFF:  '1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw',
  ABSENSI:         '1FU5hKMpYn1qhsl4-xZYUZrXDhTOV6aRRewYEs6gIkxA',
}

// Exact sheet tab names as they appear in each Google Sheets file
export const SHEET_NAMES = {
  // DATABASE STAFF → sheet: MASTER DATA STAFF
  STAFF: 'MASTER DATA STAFF',

  // Database Driver Airport → one sheet per branch
  AIRPORT_BATAM:      'ID Rifim Airport Batam',
  AIRPORT_JAMBI:      'ID Rifim Airport Jambi',
  AIRPORT_BALIKPAPAN: 'ID Rifim Airport Balikpapan',
  AIRPORT_MANADO:     'ID Rifim Airport Manado',
  AIRPORT_PEKANBARU:  'ID Rifim Airport Pekanbaru',

  // Database Driver External → one sheet per external branch
  EXTERNAL_BATAM:     'ID Rifim Batam',
  EXTERNAL_JAMBI:     'ID Rifim Jambi Luar',
}

function gvizUrl(sheetId, sheetName = '') {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  return sheetName ? `${base}&sheet=${encodeURIComponent(sheetName)}` : base
}

async function fetchGviz(sheetId, sheetName = '') {
  const url = gvizUrl(sheetId, sheetName)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const json = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')
  return JSON.parse(json)
}

function rowValues(row) {
  return (row.c || []).map(cell => {
    if (!cell) return ''
    if (cell.v === null || cell.v === undefined) return ''
    return String(cell.v).trim()
  })
}

// ─── Airport Drivers ───────────────────────────────────────────────────────
// Each sheet in DRIVER_AIRPORT file maps to one branch
const AIRPORT_SHEETS = [
  { sheetName: SHEET_NAMES.AIRPORT_BATAM,      branchId: 'ID Rifim Airport Batam' },
  { sheetName: SHEET_NAMES.AIRPORT_JAMBI,      branchId: 'ID Rifim Airport Jambi' },
  { sheetName: SHEET_NAMES.AIRPORT_BALIKPAPAN, branchId: 'ID Rifim Airport Balikpapan' },
  { sheetName: SHEET_NAMES.AIRPORT_MANADO,     branchId: 'ID Rifim Airport Manado' },
  { sheetName: SHEET_NAMES.AIRPORT_PEKANBARU,  branchId: 'ID Rifim Airport Pekanbaru' },
]

async function fetchDriversFromSheet(sheetId, sheetName, branchId) {
  const data = await fetchGviz(sheetId, sheetName)
  const rows = data.table.rows || []
  return rows.slice(1).map((row, i) => {
    const v = rowValues(row)
    return {
      id:           v[0] || `${branchId}-${i}`,
      name:         v[1] || '',
      nik:          v[2] || '',
      phone:        v[3] || '',
      vehicle:      v[4] || '',
      plateNumber:  v[5] || '',
      airportId:    v[6] || branchId,
      status:       (v[7] || 'offline').toLowerCase(),
      joinDate:     v[8] || '',
      rating:       parseFloat(v[9]) || 4.0,
      totalPickups: parseInt(v[10]) || 0,
      lastLat:      parseFloat(v[11]) || 0,
      lastLng:      parseFloat(v[12]) || 0,
      type:         'airport',
    }
  }).filter(d => d.name)
}

export async function fetchDriverAirport() {
  const results = await Promise.all(
    AIRPORT_SHEETS.map(({ sheetName, branchId }) =>
      fetchDriversFromSheet(SHEET_IDS.DRIVER_AIRPORT, sheetName, branchId).catch(() => [])
    )
  )
  return results.flat()
}

// ─── External Drivers ──────────────────────────────────────────────────────
const EXTERNAL_SHEETS = [
  { sheetName: SHEET_NAMES.EXTERNAL_BATAM, branchId: 'ID Rifim Batam' },
  { sheetName: SHEET_NAMES.EXTERNAL_JAMBI, branchId: 'ID Rifim Jambi Luar' },
]

export async function fetchDriverExternal() {
  const results = await Promise.all(
    EXTERNAL_SHEETS.map(({ sheetName, branchId }) =>
      fetchDriversFromSheet(SHEET_IDS.DRIVER_EXTERNAL, sheetName, branchId)
        .then(rows => rows.map(d => ({ ...d, type: 'external' })))
        .catch(() => [])
    )
  )
  return results.flat()
}

// ─── Staff ─────────────────────────────────────────────────────────────────
export async function fetchStaff() {
  const data = await fetchGviz(SHEET_IDS.DATABASE_STAFF, SHEET_NAMES.STAFF)
  const rows = data.table.rows || []
  return rows.slice(1).map((row, i) => {
    const v = rowValues(row)
    return {
      id:        v[0] || `stf-gs-${i}`,
      name:      v[1] || '',
      nik:       v[2] || '',
      phone:     v[3] || '',
      email:     v[4] || '',
      role:      v[5] || 'Staff',
      airportId: v[6] || '',
      status:    (v[7] || 'active').toLowerCase(),
      joinDate:  v[8] || '',
    }
  }).filter(s => s.name)
}

// ─── Combined fetch with fallback ──────────────────────────────────────────
export async function fetchAllDrivers(mockDrivers) {
  try {
    const [airport, external] = await Promise.all([
      fetchDriverAirport().catch(() => []),
      fetchDriverExternal().catch(() => []),
    ])
    const combined = [...airport, ...external]
    if (combined.length === 0) throw new Error('Empty result')
    return { data: combined, source: 'google_sheets' }
  } catch (err) {
    console.warn('Google Sheets driver fetch failed, using mock data:', err.message)
    return { data: mockDrivers, source: 'mock' }
  }
}

export async function fetchAllStaff(mockStaff) {
  try {
    const staff = await fetchStaff()
    if (staff.length === 0) throw new Error('Empty result')
    return { data: staff, source: 'google_sheets' }
  } catch (err) {
    console.warn('Google Sheets staff fetch failed, using mock data:', err.message)
    return { data: mockStaff, source: 'mock' }
  }
}

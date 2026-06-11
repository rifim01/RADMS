/**
 * Google Sheets data service — GVIZ API
 * Columns as they actually exist in the sheets:
 *
 * Driver Airport  : A=No, B=ID Driver, C=Nama Driver, D=Cabang
 * Driver External : A=NO, B=ID Driver, C=Nama,        D=Id Cabang
 * Staff           : (see fetchStaff — share header when available)
 */

export const SHEET_IDS = {
  DRIVER_EXTERNAL: '1suoDC-RsWOgTHiLq4max6iIsWe39Ou-RMddRXl5DVJc',
  DRIVER_AIRPORT:  '1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_Tlc',
  DATABASE_STAFF:  '1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw',
  ABSENSI:         '1FU5hKMpYn1qhsl4-xZYUZrXDhTOV6aRRewYEs6gIkxA',
}

export const SHEET_NAMES = {
  STAFF:              'MASTER DATA STAFF',
  AIRPORT_BATAM:      'ID Rifim Airport Batam',
  AIRPORT_JAMBI:      'ID Rifim Airport Jambi',
  AIRPORT_BALIKPAPAN: 'ID Rifim Airport Balikpapan',
  AIRPORT_MANADO:     'ID Rifim Airport Manado',
  AIRPORT_PEKANBARU:  'ID Rifim Airport Pekanbaru',
  EXTERNAL_BATAM:     'ID Rifim Batam',
  EXTERNAL_JAMBI:     'ID Rifim Jambi Luar',
}

async function fetchGviz(sheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const json = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')
  return JSON.parse(json)
}

function cellVal(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return ''
  return String(cell.v).trim()
}

// ─── Driver Airport ────────────────────────────────────────────────────────
// Columns: A=No  B=ID Driver  C=Nama Driver  D=Cabang
const AIRPORT_SHEETS = [
  SHEET_NAMES.AIRPORT_BATAM,
  SHEET_NAMES.AIRPORT_JAMBI,
  SHEET_NAMES.AIRPORT_BALIKPAPAN,
  SHEET_NAMES.AIRPORT_MANADO,
  SHEET_NAMES.AIRPORT_PEKANBARU,
]

async function fetchAirportSheet(sheetName) {
  const data = await fetchGviz(SHEET_IDS.DRIVER_AIRPORT, sheetName)
  const rows = (data.table?.rows || []).slice(1)
  return rows.map(row => {
    const c = row.c || []
    const driverId = cellVal(c[1])
    const name     = cellVal(c[2])
    const branch   = cellVal(c[3]) || sheetName
    if (!name) return null
    return {
      id:          driverId || `${sheetName}-${name}`,
      nik:         driverId,
      name,
      airportId:   branch,
      phone:       '',
      vehicle:     '',
      plateNumber: '',
      status:      'offline',
      type:        'airport',
    }
  }).filter(Boolean)
}

export async function fetchDriverAirport() {
  const results = await Promise.all(
    AIRPORT_SHEETS.map(s => fetchAirportSheet(s).catch(() => []))
  )
  return results.flat()
}

// ─── Driver External ───────────────────────────────────────────────────────
// Columns: A=NO  B=ID Driver  C=Nama  D=Id Cabang
const EXTERNAL_SHEETS = [
  SHEET_NAMES.EXTERNAL_BATAM,
  SHEET_NAMES.EXTERNAL_JAMBI,
]

async function fetchExternalSheet(sheetName) {
  const data = await fetchGviz(SHEET_IDS.DRIVER_EXTERNAL, sheetName)
  const rows = (data.table?.rows || []).slice(1)
  return rows.map(row => {
    const c = row.c || []
    const driverId = cellVal(c[1])
    const name     = cellVal(c[2])
    const branch   = cellVal(c[3]) || sheetName
    if (!name) return null
    return {
      id:          driverId || `${sheetName}-${name}`,
      nik:         driverId,
      name,
      airportId:   branch,
      phone:       '',
      vehicle:     '',
      plateNumber: '',
      status:      'offline',
      type:        'external',
    }
  }).filter(Boolean)
}

export async function fetchDriverExternal() {
  const results = await Promise.all(
    EXTERNAL_SHEETS.map(s => fetchExternalSheet(s).catch(() => []))
  )
  return results.flat()
}

// ─── Staff ─────────────────────────────────────────────────────────────────
// Columns: A=Email  B=Nama  C=Gaji Staff  D=ID CABANG  E=ID Staff  F=Jabatan  G=Deposit
export async function fetchStaff() {
  const data = await fetchGviz(SHEET_IDS.DATABASE_STAFF, SHEET_NAMES.STAFF)
  const rows = (data.table?.rows || []).slice(1)
  return rows.map((row, i) => {
    const c = row.c || []
    const name = cellVal(c[1])
    if (!name) return null
    return {
      id:        cellVal(c[4]) || `stf-${i}`,   // E: ID Staff (RIF0125, etc.)
      name,                                       // B: Nama
      email:     cellVal(c[0]) || '',             // A: Email
      gaji:      cellVal(c[2]) || '',             // C: Gaji Staff
      airportId: cellVal(c[3]) || '',             // D: ID CABANG
      staffId:   cellVal(c[4]) || '',             // E: ID Staff
      role:      cellVal(c[5]) || 'Staff',        // F: Jabatan
      deposit:   cellVal(c[6]) || '',             // G: Deposit
      status:    'active',
    }
  }).filter(Boolean)
}

// ─── Users (Staff login role mapping) ────────────────────────────────────
// USERS sheet columns: A=Email  B=Password  C=Nama  D=Cabang  E=Jabatan  F=Role
export async function fetchUsers() {
  try {
    const data = await fetchGviz(SHEET_IDS.ABSENSI, 'USERS')
    const rows = (data.table?.rows || []).slice(1)
    return rows.map(row => {
      const c = row.c || []
      const email = cellVal(c[0]).toLowerCase()
      if (!email) return null
      return {
        email,
        nama:    cellVal(c[2]),
        cabang:  cellVal(c[3]),
        jabatan: cellVal(c[4]),
        role:    cellVal(c[5]) || 'staff',
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}
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
    console.warn('Sheets driver fetch failed, using mock:', err.message)
    return { data: mockDrivers, source: 'mock' }
  }
}

export async function fetchAllStaff(mockStaff) {
  try {
    const staff = await fetchStaff()
    if (staff.length === 0) throw new Error('Empty result')
    return { data: staff, source: 'google_sheets' }
  } catch (err) {
    console.warn('Sheets staff fetch failed, using mock:', err.message)
    return { data: mockStaff, source: 'mock' }
  }
}

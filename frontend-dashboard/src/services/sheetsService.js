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
  AIRPORT_MAKASSAR:   'ID Rifim Airport Makassar',
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
  SHEET_NAMES.AIRPORT_MAKASSAR,
]

async function fetchAirportSheet(sheetName) {
  const data = await fetchGviz(SHEET_IDS.DRIVER_AIRPORT, sheetName)
  // Do NOT slice(1) — guard against header row instead (handles sheets with few rows)
  const rows = data.table?.rows || []
  return rows.map(row => {
    const c = row.c || []
    const driverId = cellVal(c[1])
    const name     = cellVal(c[2])
    const branch   = cellVal(c[3]) || sheetName
    if (!name || name === 'Nama Driver' || name === 'Nama' || driverId === 'ID Driver') return null
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
  // Do NOT slice(1) — guard against header row instead
  const rows = data.table?.rows || []
  return rows.map(row => {
    const c = row.c || []
    const driverId = cellVal(c[1])
    const name     = cellVal(c[2])
    const branch   = cellVal(c[3]) || sheetName
    if (!name || name === 'Nama' || name === 'Nama Driver' || driverId === 'ID Driver') return null
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
  // Do NOT slice(1) — GVIZ may already exclude the header; guard against header row instead
  const rows = data.table?.rows || []
  return rows.map((row, i) => {
    const c = row.c || []
    const name = cellVal(c[1])
    if (!name || name.toLowerCase() === 'nama') return null  // skip header if included
    return {
      id:        cellVal(c[4]) || `stf-${i}`,
      name,
      email:     cellVal(c[0]) || '',
      gaji:      cellVal(c[2]) || '',
      airportId: cellVal(c[3]) || '',
      staffId:   cellVal(c[4]) || '',
      role:      cellVal(c[5]) || 'Staff',
      deposit:   cellVal(c[6]) || '',
      status:    'active',
    }
  }).filter(Boolean)
}

// ─── Users (Staff login role mapping) ────────────────────────────────────
// USERS sheet columns: A=Email  B=Password  C=Nama  D=Cabang  E=Jabatan  F=Role
export async function fetchUsers() {
  try {
    const data = await fetchGviz(SHEET_IDS.ABSENSI, 'USERS')
    // Do NOT slice(1) — guard against header row presence
    const rows = data.table?.rows || []
    return rows.map(row => {
      const c = row.c || []
      const email = cellVal(c[0]).toLowerCase()
      if (!email || email === 'email') return null  // skip header if included
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
const CACHE_TTL = 5 * 60 * 1000
let _driverCache = null; let _driverCacheTime = 0
let _staffCache  = null; let _staffCacheTime  = 0

export async function fetchAllDrivers(forceRefresh = false) {
  if (!forceRefresh && _driverCache && Date.now() - _driverCacheTime < CACHE_TTL) {
    return _driverCache
  }
  try {
    const [airport, external] = await Promise.all([
      fetchDriverAirport().catch(() => []),
      fetchDriverExternal().catch(() => []),
    ])
    const combined = [...airport, ...external]
    const result = { data: combined, source: combined.length > 0 ? 'google_sheets' : 'empty' }
    _driverCache = result; _driverCacheTime = Date.now()
    return result
  } catch (err) {
    console.warn('Sheets driver fetch failed:', err.message)
    return { data: [], source: 'empty' }
  }
}

export async function fetchAllStaff(forceRefresh = false) {
  if (!forceRefresh && _staffCache && Date.now() - _staffCacheTime < CACHE_TTL) {
    return _staffCache
  }
  try {
    const staff = await fetchStaff()
    const result = { data: staff, source: staff.length > 0 ? 'google_sheets' : 'empty' }
    _staffCache = result; _staffCacheTime = Date.now()
    return result
  } catch (err) {
    console.warn('Sheets staff fetch failed:', err.message)
    return { data: [], source: 'empty' }
  }
}

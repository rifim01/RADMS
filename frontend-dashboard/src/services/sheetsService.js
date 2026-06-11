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

function gvizUrl(sheetId, sheetName = '') {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  return sheetName ? `${base}&sheet=${encodeURIComponent(sheetName)}` : base
}

async function fetchGviz(sheetId, sheetName = '') {
  const url = gvizUrl(sheetId, sheetName)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  // Strip /*O_o*/ prefix and google.visualization.Query.setResponse(...) wrapper
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

// ─── Driver Airport ────────────────────────────────────────────────────────
export async function fetchDriverAirport() {
  const data = await fetchGviz(SHEET_IDS.DRIVER_AIRPORT)
  const rows = data.table.rows || []
  return rows.slice(1).map((row, i) => {
    const v = rowValues(row)
    return {
      id:          v[0] || `drv-ext-${i}`,
      name:        v[1] || '',
      nik:         v[2] || '',
      phone:       v[3] || '',
      vehicle:     v[4] || '',
      plateNumber: v[5] || '',
      airportId:   v[6] || '',
      status:      (v[7] || 'offline').toLowerCase(),
      joinDate:    v[8] || '',
      rating:      parseFloat(v[9]) || 4.0,
      totalPickups: parseInt(v[10]) || 0,
      lastLat:     parseFloat(v[11]) || 0,
      lastLng:     parseFloat(v[12]) || 0,
    }
  }).filter(d => d.name)
}

// ─── Driver External ───────────────────────────────────────────────────────
export async function fetchDriverExternal() {
  const data = await fetchGviz(SHEET_IDS.DRIVER_EXTERNAL)
  const rows = data.table.rows || []
  return rows.slice(1).map((row, i) => {
    const v = rowValues(row)
    return {
      id:          v[0] || `drv-ap-${i}`,
      name:        v[1] || '',
      nik:         v[2] || '',
      phone:       v[3] || '',
      vehicle:     v[4] || '',
      plateNumber: v[5] || '',
      airportId:   v[6] || '',
      status:      (v[7] || 'offline').toLowerCase(),
      joinDate:    v[8] || '',
      rating:      parseFloat(v[9]) || 4.0,
      totalPickups: parseInt(v[10]) || 0,
      type:        'external',
    }
  }).filter(d => d.name)
}

// ─── Staff ─────────────────────────────────────────────────────────────────
export async function fetchStaff() {
  const data = await fetchGviz(SHEET_IDS.DATABASE_STAFF)
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

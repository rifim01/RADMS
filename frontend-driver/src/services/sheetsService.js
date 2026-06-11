// Fetch driver data from Google Sheets for login validation
const SHEET_IDS = {
  DRIVER_AIRPORT:  '1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_Tlc',
  DRIVER_EXTERNAL: '1suoDC-RsWOgTHiLq4max6iIsWe39Ou-RMddRXl5DVJc',
}

const AIRPORT_SHEETS  = ['ID Rifim Airport Batam','ID Rifim Airport Jambi','ID Rifim Airport Balikpapan','ID Rifim Airport Manado','ID Rifim Airport Pekanbaru']
const EXTERNAL_SHEETS = ['ID Rifim Batam','ID Rifim Jambi Luar']

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

async function fetchSheet(sheetId, sheetName) {
  const data = await fetchGviz(sheetId, sheetName)
  const rows = (data.table?.rows || []).slice(1)
  return rows.map(row => {
    const c = row.c || []
    const driverId = cellVal(c[1])
    const name     = cellVal(c[2])
    const branch   = cellVal(c[3]) || sheetName
    if (!name) return null
    return { id: driverId, nik: driverId, name, airportId: branch }
  }).filter(Boolean)
}

// Load all drivers from all sheets, cache result
let _cache = null
let _cacheTime = 0

export async function getAllDrivers() {
  if (_cache && Date.now() - _cacheTime < 5 * 60 * 1000) return _cache

  const results = await Promise.all([
    ...AIRPORT_SHEETS.map(s  => fetchSheet(SHEET_IDS.DRIVER_AIRPORT, s).catch(() => [])),
    ...EXTERNAL_SHEETS.map(s => fetchSheet(SHEET_IDS.DRIVER_EXTERNAL, s).catch(() => [])),
  ])
  _cache = results.flat()
  _cacheTime = Date.now()
  return _cache
}

// Find driver by NIK/ID (used for login)
export async function findDriverByNik(nik) {
  const drivers = await getAllDrivers()
  const clean = nik.replace(/\D/g, '')
  return drivers.find(d => d.nik.replace(/\D/g, '') === clean) || null
}

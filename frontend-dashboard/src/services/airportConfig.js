export const AIRPORT_BRANCHES = {
  "ID Rifim Airport Batam":      { lat: 1.1222699737600552,  lng: 104.11830538258901, r: 500,    admin: false, tz: "WIB",  deductionExempt: false },
  "ID Rifim Airport Jambi":      { lat: -1.636867558115533,  lng: 103.6442494672467,  r: 500,    admin: false, tz: "WIB",  deductionExempt: true  },
  "ID Rifim Airport Balikpapan": { lat: -1.267625979363085,  lng: 116.89423472491762, r: 500,    admin: false, tz: "WITA", deductionExempt: false },
  "ID Rifim Airport Manado":     { lat: 1.550165772441465,   lng: 124.9254933960822,  r: 500,    admin: false, tz: "WITA", deductionExempt: true  },
  "ID Rifim Airport Pekanbaru":  { lat: 0.46454514194723073, lng: 101.44817503840943, r: 500,    admin: false, tz: "WIB",  deductionExempt: false },
  "ID Rifim Batam":              { lat: 1.1211,              lng: 104.0402,           r: 2000,   admin: false, tz: "WIB",  deductionExempt: false },
  "ID Rifim Jambi Luar":         { lat: -1.6500,             lng: 103.6300,           r: 2000,   admin: false, tz: "WIB",  deductionExempt: true  },
  "Admin":                       { lat: 0,                   lng: 0,                  r: 999999, admin: true,  tz: "WIB",  deductionExempt: true  },
}

// Attendance time windows per shift
// Format: { start: "HH:MM", windowEnd: "HH:MM", lateStart: "HH:MM", lateEnd: "HH:MM" }
export const SHIFT_WINDOWS = {
  PAGI:        { label: "Pagi",        start: "06:00", windowEnd: "07:05", lateStart: "07:07", lateEnd: "07:45" },
  MIDDLE:      { label: "Middle",      start: "10:00", windowEnd: "11:05", lateStart: "11:07", lateEnd: "11:45" },
  SIANG:       { label: "Siang",       start: "14:00", windowEnd: "15:05", lateStart: "15:07", lateEnd: "15:45" },
  SIANG_BATAM: { label: "Siang Batam", start: "13:00", windowEnd: "14:05", lateStart: "14:07", lateEnd: "14:45" },
}

// Storage folder ID for attendance data
export const ATTENDANCE_FOLDER_ID = '1Ejaz210g3TeM46W6up5BtgHNzEWwOnRQ'

// Google Sheet IDs
export const SHEET_IDS = {
  ABSENSI:         '1FU5hKMpYn1qhsl4-xZYUZrXDhTOV6aRRewYEs6gIkxA',
  DRIVER_EXTERNAL: '1suoDC-RsWOgTHiLq4max6iIsWe39Ou-RMddRXl5DVJc',
  DRIVER_AIRPORT:  '1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_Tlc',
  DATABASE_STAFF:  '1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw',
}

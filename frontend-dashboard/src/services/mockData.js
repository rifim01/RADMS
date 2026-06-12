// ============================================================
// MOCK DATA - RADMS (RIFIM Airport Driver Management System)
// ============================================================

// ---------------------------------------------------------------------------
// Attendance mock data for all 7 branches (GVIZ-parsed format)
// columns: timestamp, date, time, nama, idCabang, status (Masuk/Pulang)
// ---------------------------------------------------------------------------
function daysAgo(n) {
  const d = new Date('2026-06-10')
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function mkRec(date, time, nama, idCabang, statusIn) {
  return {
    timestamp: `${date} ${time}:00`,
    date,
    time,
    nama,
    idCabang,
    status: statusIn,
  }
}

export const MOCK_ATTENDANCE_DATA = [
  // ---- ID Rifim Airport Batam ----
  mkRec('2026-06-10', '06:45', 'Andi Saputra',      'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-10', '15:00', 'Andi Saputra',      'ID Rifim Airport Batam', 'Pulang'),
  mkRec('2026-06-10', '07:10', 'Budi Kurniawan',    'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-10', '07:03', 'Citra Dewi',        'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-10', '07:20', 'Dian Permata',      'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-10', '13:02', 'Edi Prasetyo',      'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-09', '06:55', 'Andi Saputra',      'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-09', '15:05', 'Andi Saputra',      'ID Rifim Airport Batam', 'Pulang'),
  mkRec('2026-06-09', '07:30', 'Budi Kurniawan',    'ID Rifim Airport Batam', 'Masuk'),
  mkRec('2026-06-09', '07:01', 'Citra Dewi',        'ID Rifim Airport Batam', 'Masuk'),
  mkRec(daysAgo(2),   '06:50', 'Andi Saputra',      'ID Rifim Airport Batam', 'Masuk'),
  mkRec(daysAgo(2),   '07:40', 'Budi Kurniawan',    'ID Rifim Airport Batam', 'Masuk'),
  mkRec(daysAgo(3),   '08:30', 'Dian Permata',      'ID Rifim Airport Batam', 'Masuk'),

  // ---- ID Rifim Airport Jambi ----
  mkRec('2026-06-10', '06:58', 'Fajar Nugroho',     'ID Rifim Airport Jambi', 'Masuk'),
  mkRec('2026-06-10', '07:08', 'Gita Rahayu',       'ID Rifim Airport Jambi', 'Masuk'),
  mkRec('2026-06-10', '07:35', 'Hendra Wijaya',     'ID Rifim Airport Jambi', 'Masuk'),
  mkRec('2026-06-10', '10:03', 'Indah Lestari',     'ID Rifim Airport Jambi', 'Masuk'),
  mkRec('2026-06-09', '07:00', 'Fajar Nugroho',     'ID Rifim Airport Jambi', 'Masuk'),
  mkRec('2026-06-09', '15:02', 'Fajar Nugroho',     'ID Rifim Airport Jambi', 'Pulang'),
  mkRec('2026-06-09', '07:22', 'Gita Rahayu',       'ID Rifim Airport Jambi', 'Masuk'),
  mkRec(daysAgo(2),   '06:48', 'Fajar Nugroho',     'ID Rifim Airport Jambi', 'Masuk'),
  mkRec(daysAgo(3),   '07:12', 'Hendra Wijaya',     'ID Rifim Airport Jambi', 'Masuk'),

  // ---- ID Rifim Airport Balikpapan (WITA) ----
  // WITA is +1 hour from WIB; local time 07:45 WITA = 06:45 WIB → Hadir Pagi
  mkRec('2026-06-10', '07:45', 'Joko Santoso',      'ID Rifim Airport Balikpapan', 'Masuk'),
  mkRec('2026-06-10', '08:10', 'Kartika Sari',      'ID Rifim Airport Balikpapan', 'Masuk'),
  mkRec('2026-06-10', '07:55', 'Lukman Hakim',      'ID Rifim Airport Balikpapan', 'Masuk'),
  mkRec('2026-06-10', '08:45', 'Maya Kusuma',       'ID Rifim Airport Balikpapan', 'Masuk'),
  mkRec('2026-06-09', '07:50', 'Joko Santoso',      'ID Rifim Airport Balikpapan', 'Masuk'),
  mkRec('2026-06-09', '15:55', 'Joko Santoso',      'ID Rifim Airport Balikpapan', 'Pulang'),
  mkRec(daysAgo(2),   '07:48', 'Kartika Sari',      'ID Rifim Airport Balikpapan', 'Masuk'),

  // ---- ID Rifim Airport Manado (WITA) ----
  mkRec('2026-06-10', '07:52', 'Nanda Pratama',     'ID Rifim Airport Manado', 'Masuk'),
  mkRec('2026-06-10', '08:03', 'Olivia Sianturi',   'ID Rifim Airport Manado', 'Masuk'),
  mkRec('2026-06-10', '08:40', 'Paulus Mambrasar',  'ID Rifim Airport Manado', 'Masuk'),
  mkRec('2026-06-09', '07:55', 'Nanda Pratama',     'ID Rifim Airport Manado', 'Masuk'),
  mkRec('2026-06-09', '15:52', 'Nanda Pratama',     'ID Rifim Airport Manado', 'Pulang'),
  mkRec(daysAgo(2),   '08:00', 'Olivia Sianturi',   'ID Rifim Airport Manado', 'Masuk'),

  // ---- ID Rifim Airport Pekanbaru ----
  mkRec('2026-06-10', '06:53', 'Qory Andini',       'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec('2026-06-10', '07:02', 'Rizal Mahendra',    'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec('2026-06-10', '07:15', 'Sari Anggraini',    'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec('2026-06-10', '09:00', 'Taufik Hidayat',    'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec('2026-06-09', '07:00', 'Qory Andini',       'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec('2026-06-09', '15:10', 'Qory Andini',       'ID Rifim Airport Pekanbaru', 'Pulang'),
  mkRec('2026-06-09', '07:20', 'Rizal Mahendra',    'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec(daysAgo(2),   '06:47', 'Qory Andini',       'ID Rifim Airport Pekanbaru', 'Masuk'),
  mkRec(daysAgo(3),   '07:10', 'Sari Anggraini',    'ID Rifim Airport Pekanbaru', 'Masuk'),

  // ---- ID Rifim Batam ----
  mkRec('2026-06-10', '06:40', 'Umar Hasbullah',    'ID Rifim Batam', 'Masuk'),
  mkRec('2026-06-10', '07:03', 'Vina Oktaviani',    'ID Rifim Batam', 'Masuk'),
  mkRec('2026-06-10', '13:05', 'Wawan Setiawan',    'ID Rifim Batam', 'Masuk'),
  mkRec('2026-06-10', '14:30', 'Xavier Simanjuntak','ID Rifim Batam', 'Masuk'),
  mkRec('2026-06-09', '06:55', 'Umar Hasbullah',    'ID Rifim Batam', 'Masuk'),
  mkRec('2026-06-09', '15:00', 'Umar Hasbullah',    'ID Rifim Batam', 'Pulang'),
  mkRec(daysAgo(2),   '07:00', 'Vina Oktaviani',    'ID Rifim Batam', 'Masuk'),

  // ---- ID Rifim Jambi Luar ----
  mkRec('2026-06-10', '06:52', 'Yeni Puspita',      'ID Rifim Jambi Luar', 'Masuk'),
  mkRec('2026-06-10', '07:10', 'Zainudin Arifin',   'ID Rifim Jambi Luar', 'Masuk'),
  mkRec('2026-06-10', '07:40', 'Agus Triyanto',     'ID Rifim Jambi Luar', 'Masuk'),
  mkRec('2026-06-10', '10:05', 'Bagas Wicaksono',   'ID Rifim Jambi Luar', 'Masuk'),
  mkRec('2026-06-09', '06:58', 'Yeni Puspita',      'ID Rifim Jambi Luar', 'Masuk'),
  mkRec('2026-06-09', '15:05', 'Yeni Puspita',      'ID Rifim Jambi Luar', 'Pulang'),
  mkRec(daysAgo(2),   '07:05', 'Zainudin Arifin',   'ID Rifim Jambi Luar', 'Masuk'),
  mkRec(daysAgo(3),   '07:35', 'Agus Triyanto',     'ID Rifim Jambi Luar', 'Masuk'),
]

export const AIRPORTS = [
  {
    id: 'ID Rifim Airport Batam',
    code: 'BTH',
    name: 'Hang Nadim',
    city: 'Batam',
    province: 'Kepulauan Riau',
    fullName: 'Bandara Internasional Hang Nadim Batam',
    lat: 1.1222699737600552,
    lng: 104.11830538258901,
    radius: 500,
    tz: 'WIB',
    driversOnline: 12,
    queueCount: 8,
    staffActive: 3,
    totalPickupsToday: 34,
    status: 'active',
    createdAt: '2023-03-01',
  },
  {
    id: 'ID Rifim Airport Jambi',
    code: 'DJB',
    name: 'Sultan Thaha',
    city: 'Jambi',
    province: 'Jambi',
    fullName: 'Bandara Sultan Thaha Syaifuddin Jambi',
    lat: -1.636867558115533,
    lng: 103.6442494672467,
    radius: 500,
    tz: 'WIB',
    driversOnline: 8,
    queueCount: 5,
    staffActive: 2,
    totalPickupsToday: 21,
    status: 'active',
    createdAt: '2023-04-15',
  },
  {
    id: 'ID Rifim Airport Balikpapan',
    code: 'BPN',
    name: 'Sultan Aji Muhammad Sulaiman',
    city: 'Balikpapan',
    province: 'Kalimantan Timur',
    fullName: 'Bandara Sultan Aji Muhammad Sulaiman Sepinggan Balikpapan',
    lat: -1.267625979363085,
    lng: 116.89423472491762,
    radius: 500,
    tz: 'WITA',
    driversOnline: 15,
    queueCount: 10,
    staffActive: 4,
    totalPickupsToday: 42,
    status: 'active',
    createdAt: '2023-02-20',
  },
  {
    id: 'ID Rifim Airport Manado',
    code: 'MDC',
    name: 'Sam Ratulangi',
    city: 'Manado',
    province: 'Sulawesi Utara',
    fullName: 'Bandara Internasional Sam Ratulangi Manado',
    lat: 1.550165772441465,
    lng: 124.9254933960822,
    radius: 500,
    tz: 'WITA',
    driversOnline: 10,
    queueCount: 6,
    staffActive: 2,
    totalPickupsToday: 28,
    status: 'active',
    createdAt: '2023-05-10',
  },
  {
    id: 'ID Rifim Airport Pekanbaru',
    code: 'PKU',
    name: 'Sultan Syarif Kasim II',
    city: 'Pekanbaru',
    province: 'Riau',
    fullName: 'Bandara Sultan Syarif Kasim II Pekanbaru',
    lat: 0.46454514194723073,
    lng: 101.44817503840943,
    radius: 500,
    tz: 'WIB',
    driversOnline: 9,
    queueCount: 7,
    staffActive: 2,
    totalPickupsToday: 25,
    status: 'active',
    createdAt: '2023-06-01',
  },
  {
    id: 'ID Rifim Airport Makassar',
    code: 'UPG',
    name: 'Sultan Hasanuddin',
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    fullName: 'Bandara Internasional Sultan Hasanuddin Makassar',
    lat: -5.074472,
    lng: 119.543889,
    radius: 500,
    tz: 'WITA',
    driversOnline: 0,
    queueCount: 0,
    staffActive: 0,
    totalPickupsToday: 0,
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'ID Rifim Batam',
    code: 'BTM',
    name: 'Area Luar Batam',
    city: 'Batam',
    province: 'Kepulauan Riau',
    fullName: 'ID Rifim Batam (Area Luar)',
    lat: 1.1211,
    lng: 104.0402,
    radius: 2000,
    tz: 'WIB',
    driversOnline: 5,
    queueCount: 3,
    staffActive: 1,
    totalPickupsToday: 10,
    status: 'active',
    createdAt: '2023-07-01',
  },
  {
    id: 'ID Rifim Jambi Luar',
    code: 'JBL',
    name: 'Area Luar Jambi',
    city: 'Jambi',
    province: 'Jambi',
    fullName: 'ID Rifim Jambi Luar (Area Luar)',
    lat: -1.6500,
    lng: 103.6300,
    radius: 2000,
    tz: 'WIB',
    driversOnline: 4,
    queueCount: 2,
    staffActive: 1,
    totalPickupsToday: 8,
    status: 'active',
    createdAt: '2023-07-15',
  },
]

export const DRIVERS = [
  // Batam Airport
  { id: 'drv-01', name: 'Ahmad Fauzi', nik: '2171011234560001', phone: '081234567890', vehicle: 'Toyota Avanza', plateNumber: 'BP 1234 AB', airportId: 'ID Rifim Airport Batam', status: 'online', lastLat: 1.1223, lastLng: 104.1183, speed: 0, lastSeen: '2026-06-10T08:30:00', totalPickups: 312, rating: 4.8, joinDate: '2022-03-10' },
  { id: 'drv-02', name: 'Budi Santoso', nik: '2171021234560002', phone: '081234567891', vehicle: 'Suzuki Ertiga', plateNumber: 'BP 5678 CD', airportId: 'ID Rifim Airport Batam', status: 'online', lastLat: 1.1230, lastLng: 104.1190, speed: 15, lastSeen: '2026-06-10T08:31:00', totalPickups: 245, rating: 4.6, joinDate: '2022-05-15' },
  { id: 'drv-03', name: 'Chandra Wijaya', nik: '2171031234560003', phone: '081234567892', vehicle: 'Daihatsu Xenia', plateNumber: 'BP 9012 EF', airportId: 'ID Rifim Airport Batam', status: 'offline', lastLat: 1.1215, lastLng: 104.1175, speed: 0, lastSeen: '2026-06-10T06:15:00', totalPickups: 178, rating: 4.5, joinDate: '2022-07-20' },
  // Jambi Airport
  { id: 'drv-04', name: 'Deni Prasetyo', nik: '1571041234560004', phone: '081234567893', vehicle: 'Toyota Avanza', plateNumber: 'BH 1234 AB', airportId: 'ID Rifim Airport Jambi', status: 'online', lastLat: -1.6369, lastLng: 103.6442, speed: 0, lastSeen: '2026-06-10T08:32:00', totalPickups: 420, rating: 4.9, joinDate: '2021-11-05' },
  { id: 'drv-05', name: 'Eko Wahyudi', nik: '1571051234560005', phone: '081234567894', vehicle: 'Honda Mobilio', plateNumber: 'BH 5678 CD', airportId: 'ID Rifim Airport Jambi', status: 'offline', lastLat: -1.6380, lastLng: 103.6455, speed: 0, lastSeen: '2026-06-10T07:00:00', totalPickups: 156, rating: 4.3, joinDate: '2023-01-18' },
  // Balikpapan Airport
  { id: 'drv-06', name: 'Fajar Nugroho', nik: '6471061234560006', phone: '081234567895', vehicle: 'Toyota Calya', plateNumber: 'KT 1234 AB', airportId: 'ID Rifim Airport Balikpapan', status: 'online', lastLat: -1.2676, lastLng: 116.8942, speed: 20, lastSeen: '2026-06-10T08:33:00', totalPickups: 534, rating: 4.7, joinDate: '2021-06-12' },
  { id: 'drv-07', name: 'Gunawan Setiawan', nik: '6471071234560007', phone: '081234567896', vehicle: 'Suzuki APV', plateNumber: 'KT 5678 CD', airportId: 'ID Rifim Airport Balikpapan', status: 'online', lastLat: -1.2685, lastLng: 116.8952, speed: 0, lastSeen: '2026-06-10T08:34:00', totalPickups: 389, rating: 4.5, joinDate: '2021-09-20' },
  { id: 'drv-08', name: 'Hendra Kusuma', nik: '6471081234560008', phone: '081234567897', vehicle: 'Toyota Avanza', plateNumber: 'KT 9012 EF', airportId: 'ID Rifim Airport Balikpapan', status: 'offline', lastLat: -1.2660, lastLng: 116.8930, speed: 0, lastSeen: '2026-06-10T05:30:00', totalPickups: 267, rating: 4.4, joinDate: '2022-02-14' },
  // Manado Airport
  { id: 'drv-09', name: 'Irwan Hidayat', nik: '7171091234560009', phone: '081234567898', vehicle: 'Mitsubishi Xpander', plateNumber: 'DB 1234 AB', airportId: 'ID Rifim Airport Manado', status: 'online', lastLat: 1.5502, lastLng: 124.9255, speed: 10, lastSeen: '2026-06-10T08:35:00', totalPickups: 611, rating: 4.9, joinDate: '2020-12-01' },
  { id: 'drv-10', name: 'Joko Susanto', nik: '7171101234560010', phone: '081234567899', vehicle: 'Daihatsu Sigra', plateNumber: 'DB 5678 CD', airportId: 'ID Rifim Airport Manado', status: 'online', lastLat: 1.5510, lastLng: 124.9263, speed: 0, lastSeen: '2026-06-10T08:36:00', totalPickups: 298, rating: 4.6, joinDate: '2022-04-08' },
  // Pekanbaru Airport
  { id: 'drv-11', name: 'Kevin Ramadhan', nik: '1471111234560011', phone: '081234567800', vehicle: 'Toyota Innova', plateNumber: 'BM 1234 AB', airportId: 'ID Rifim Airport Pekanbaru', status: 'online', lastLat: 0.4645, lastLng: 101.4482, speed: 0, lastSeen: '2026-06-10T08:37:00', totalPickups: 445, rating: 4.8, joinDate: '2021-08-15' },
  { id: 'drv-12', name: 'Luki Prasetya', nik: '1471121234560012', phone: '081234567801', vehicle: 'Honda Freed', plateNumber: 'BM 5678 CD', airportId: 'ID Rifim Airport Pekanbaru', status: 'offline', lastLat: 0.4655, lastLng: 101.4492, speed: 0, lastSeen: '2026-06-10T06:30:00', totalPickups: 332, rating: 4.7, joinDate: '2022-01-25' },
  // Rifim Batam (non-airport)
  { id: 'drv-13', name: 'Muhamad Rizki', nik: '2171131234560013', phone: '081234567802', vehicle: 'Toyota Avanza', plateNumber: 'BP 3456 GH', airportId: 'ID Rifim Batam', status: 'online', lastLat: 1.1211, lastLng: 104.0402, speed: 5, lastSeen: '2026-06-10T08:38:00', totalPickups: 189, rating: 4.4, joinDate: '2022-09-30' },
  // Rifim Jambi Luar (non-airport)
  { id: 'drv-14', name: 'Nanda Saputra', nik: '1571141234560014', phone: '081234567803', vehicle: 'Suzuki Ertiga', plateNumber: 'BH 7890 IJ', airportId: 'ID Rifim Jambi Luar', status: 'online', lastLat: -1.6500, lastLng: 103.6300, speed: 0, lastSeen: '2026-06-10T08:39:00', totalPickups: 567, rating: 4.9, joinDate: '2021-03-22' },
  { id: 'drv-15', name: 'Omar Abdillah', nik: '1571151234560015', phone: '081234567804', vehicle: 'Mitsubishi Xpander', plateNumber: 'BH 1122 KL', airportId: 'ID Rifim Jambi Luar', status: 'offline', lastLat: -1.6510, lastLng: 103.6310, speed: 0, lastSeen: '2026-06-10T07:30:00', totalPickups: 223, rating: 4.5, joinDate: '2022-06-17' },
]

export const STAFF = [
  { id: 'stf-01', name: 'Rini Andriani',    nik: '2171011234580001', phone: '082345678901', email: 'rini@rifim.com',    role: 'Airport Coordinator', airportId: 'ID Rifim Airport Batam',       status: 'active',   joinDate: '2021-05-10', lastCheckin: '2026-06-10T07:00:00' },
  { id: 'stf-02', name: 'Slamet Riyadi',    nik: '1571021234580002', phone: '082345678902', email: 'slamet@rifim.com',  role: 'Staff',               airportId: 'ID Rifim Airport Jambi',       status: 'active',   joinDate: '2022-02-14', lastCheckin: '2026-06-10T07:05:00' },
  { id: 'stf-03', name: 'Tri Wahyuningsih', nik: '6471031234580003', phone: '082345678903', email: 'tri@rifim.com',     role: 'Airport Coordinator', airportId: 'ID Rifim Airport Balikpapan',  status: 'active',   joinDate: '2021-08-20', lastCheckin: '2026-06-10T06:55:00' },
  { id: 'stf-04', name: 'Ujang Permana',    nik: '7171041234580004', phone: '082345678904', email: 'ujang@rifim.com',   role: 'Staff',               airportId: 'ID Rifim Airport Manado',      status: 'inactive', joinDate: '2022-11-01', lastCheckin: '2026-06-09T07:10:00' },
  { id: 'stf-05', name: 'Vivi Oktaviani',   nik: '1471051234580005', phone: '082345678905', email: 'vivi@rifim.com',    role: 'Airport Coordinator', airportId: 'ID Rifim Airport Pekanbaru',   status: 'active',   joinDate: '2021-12-05', lastCheckin: '2026-06-10T07:02:00' },
  { id: 'stf-06', name: 'Wahyu Prasetyo',   nik: '2171061234580006', phone: '082345678906', email: 'wahyu@rifim.com',   role: 'Staff',               airportId: 'ID Rifim Batam',              status: 'active',   joinDate: '2023-01-10', lastCheckin: '2026-06-10T07:08:00' },
  { id: 'stf-07', name: 'Yuni Kartika',     nik: '1571071234580007', phone: '082345678907', email: 'yuni@rifim.com',    role: 'Staff',               airportId: 'ID Rifim Jambi Luar',         status: 'active',   joinDate: '2023-03-15', lastCheckin: '2026-06-10T07:01:00' },
]

export const QUEUE_DATA = [
  { id: 'q-001', number: 1, driverId: 'drv-01', driverName: 'Ahmad Fauzi',    plateNumber: 'BP 1234 AB', airportId: 'ID Rifim Airport Batam',      status: 'PICKUP',    joinedAt: '2026-06-10T07:15:00', calledAt: '2026-06-10T07:30:00', pickupPoint: 'Terminal Kedatangan - Gate A', passengerName: 'Budi Hartono',  destination: 'Hotel Harris Batam' },
  { id: 'q-002', number: 2, driverId: 'drv-02', driverName: 'Budi Santoso',   plateNumber: 'BP 5678 CD', airportId: 'ID Rifim Airport Batam',      status: 'CALLED',    joinedAt: '2026-06-10T07:20:00', calledAt: '2026-06-10T08:15:00', pickupPoint: 'Terminal Kedatangan - Gate B', passengerName: 'Dewi Susanti',  destination: 'Jl. Raja Ali Haji No.12' },
  { id: 'q-003', number: 3, driverId: 'drv-03', driverName: 'Chandra Wijaya', plateNumber: 'BP 9012 EF', airportId: 'ID Rifim Airport Batam',      status: 'WAITING',   joinedAt: '2026-06-10T08:00:00', calledAt: null, pickupPoint: 'Terminal Kedatangan - Gate C', passengerName: null, destination: null },
  { id: 'q-004', number: 1, driverId: 'drv-04', driverName: 'Deni Prasetyo',  plateNumber: 'BH 1234 AB', airportId: 'ID Rifim Airport Jambi',      status: 'WAITING',   joinedAt: '2026-06-10T08:00:00', calledAt: null, pickupPoint: 'Kedatangan Domestik', passengerName: null, destination: null },
  { id: 'q-005', number: 2, driverId: 'drv-05', driverName: 'Eko Wahyudi',    plateNumber: 'BH 5678 CD', airportId: 'ID Rifim Airport Jambi',      status: 'COMPLETED', joinedAt: '2026-06-10T06:00:00', calledAt: '2026-06-10T06:20:00', pickupPoint: 'Kedatangan Domestik', passengerName: 'Rudi Hartawan', destination: 'Hotel Abadi Jambi' },
  { id: 'q-006', number: 1, driverId: 'drv-06', driverName: 'Fajar Nugroho',  plateNumber: 'KT 1234 AB', airportId: 'ID Rifim Airport Balikpapan', status: 'PICKUP',    joinedAt: '2026-06-10T07:00:00', calledAt: '2026-06-10T07:45:00', pickupPoint: 'Terminal Kedatangan', passengerName: 'Rina Marlina', destination: 'Hotel Gran Senyiur' },
  { id: 'q-007', number: 2, driverId: 'drv-07', driverName: 'Gunawan Setiawan', plateNumber: 'KT 5678 CD', airportId: 'ID Rifim Airport Balikpapan', status: 'WAITING', joinedAt: '2026-06-10T07:30:00', calledAt: null, pickupPoint: 'Terminal Kedatangan', passengerName: null, destination: null },
  { id: 'q-008', number: 3, driverId: 'drv-08', driverName: 'Hendra Kusuma',  plateNumber: 'KT 9012 EF', airportId: 'ID Rifim Airport Balikpapan', status: 'CALLED',    joinedAt: '2026-06-10T07:45:00', calledAt: '2026-06-10T08:20:00', pickupPoint: 'Terminal Kedatangan', passengerName: 'Surya Dharma', destination: 'Jl. Sudirman No.50' },
  { id: 'q-009', number: 1, driverId: 'drv-09', driverName: 'Irwan Hidayat',  plateNumber: 'DB 1234 AB', airportId: 'ID Rifim Airport Manado',     status: 'WAITING',   joinedAt: '2026-06-10T08:05:00', calledAt: null, pickupPoint: 'Kedatangan Domestik', passengerName: null, destination: null },
  { id: 'q-010', number: 2, driverId: 'drv-10', driverName: 'Joko Susanto',   plateNumber: 'DB 5678 CD', airportId: 'ID Rifim Airport Manado',     status: 'PICKUP',    joinedAt: '2026-06-10T07:10:00', calledAt: '2026-06-10T07:55:00', pickupPoint: 'Kedatangan Internasional', passengerName: 'John Tan', destination: 'Hotel Aryaduta Manado' },
  { id: 'q-011', number: 1, driverId: 'drv-11', driverName: 'Kevin Ramadhan', plateNumber: 'BM 1234 AB', airportId: 'ID Rifim Airport Pekanbaru',  status: 'CALLED',    joinedAt: '2026-06-10T07:50:00', calledAt: '2026-06-10T08:25:00', pickupPoint: 'Kedatangan Domestik', passengerName: 'Siti Rahayu', destination: 'Hotel Aryaduta Pekanbaru' },
  { id: 'q-012', number: 1, driverId: 'drv-13', driverName: 'Muhamad Rizki',  plateNumber: 'BP 3456 GH', airportId: 'ID Rifim Batam',             status: 'WAITING',   joinedAt: '2026-06-10T08:30:00', calledAt: null, pickupPoint: 'Area Jemput', passengerName: null, destination: null },
]

export const ATTENDANCE_RECORDS = [
  { id: 'att-001', staffId: 'stf-01', staffName: 'Rini Andriani',    airportId: 'ID Rifim Airport Batam',      date: '2026-06-10', checkIn: '07:00:12', checkOut: '15:02:45', locationIn: '1.1223, 104.1183', locationOut: '1.1223, 104.1183', status: 'hadir' },
  { id: 'att-002', staffId: 'stf-02', staffName: 'Slamet Riyadi',    airportId: 'ID Rifim Airport Jambi',      date: '2026-06-10', checkIn: '07:05:34', checkOut: null,       locationIn: '-1.6369, 103.6442', locationOut: null, status: 'hadir' },
  { id: 'att-003', staffId: 'stf-03', staffName: 'Tri Wahyuningsih', airportId: 'ID Rifim Airport Balikpapan', date: '2026-06-10', checkIn: '06:55:21', checkOut: null,       locationIn: '-1.2676, 116.8942', locationOut: null, status: 'hadir' },
  { id: 'att-004', staffId: 'stf-04', staffName: 'Ujang Permana',    airportId: 'ID Rifim Airport Manado',     date: '2026-06-10', checkIn: null,       checkOut: null,       locationIn: null, locationOut: null, status: 'tidak_hadir' },
  { id: 'att-005', staffId: 'stf-05', staffName: 'Vivi Oktaviani',   airportId: 'ID Rifim Airport Pekanbaru',  date: '2026-06-10', checkIn: '07:02:45', checkOut: null,       locationIn: '0.4645, 101.4482', locationOut: null, status: 'hadir' },
  { id: 'att-006', staffId: 'stf-01', staffName: 'Rini Andriani',    airportId: 'ID Rifim Airport Batam',      date: '2026-06-09', checkIn: '07:01:08', checkOut: '15:00:22', locationIn: '1.1223, 104.1183', locationOut: '1.1223, 104.1183', status: 'hadir' },
  { id: 'att-007', staffId: 'stf-02', staffName: 'Slamet Riyadi',    airportId: 'ID Rifim Airport Jambi',      date: '2026-06-09', checkIn: '07:20:55', checkOut: '15:05:11', locationIn: '-1.6369, 103.6442', locationOut: '-1.6369, 103.6442', status: 'terlambat' },
  { id: 'att-008', staffId: 'stf-03', staffName: 'Tri Wahyuningsih', airportId: 'ID Rifim Airport Balikpapan', date: '2026-06-09', checkIn: '06:58:33', checkOut: '15:02:17', locationIn: '-1.2676, 116.8942', locationOut: '-1.2676, 116.8942', status: 'hadir' },
]

export const KPI_DATA = [
  { driverId: 'drv-01', driverName: 'Ahmad Fauzi', airportId: 'ID Rifim Airport Batam', attendance: 92, queueCompliance: 88, pickupActivity: 95, responseTime: 90, violation: 95, totalScore: 92.4, grade: 'A' },
  { driverId: 'drv-02', driverName: 'Budi Santoso', airportId: 'ID Rifim Airport Batam', attendance: 85, queueCompliance: 80, pickupActivity: 82, responseTime: 78, violation: 90, totalScore: 83.1, grade: 'B' },
  { driverId: 'drv-03', driverName: 'Chandra Wijaya', airportId: 'ID Rifim Airport Batam', attendance: 70, queueCompliance: 72, pickupActivity: 68, responseTime: 75, violation: 80, totalScore: 72.2, grade: 'C' },
  { driverId: 'drv-04', driverName: 'Deni Prasetyo', airportId: 'ID Rifim Airport Batam', attendance: 98, queueCompliance: 95, pickupActivity: 97, responseTime: 96, violation: 100, totalScore: 97.0, grade: 'A+' },
  { driverId: 'drv-05', driverName: 'Eko Wahyudi', airportId: 'ID Rifim Airport Batam', attendance: 60, queueCompliance: 65, pickupActivity: 58, responseTime: 62, violation: 70, totalScore: 62.6, grade: 'D' },
  { driverId: 'drv-06', driverName: 'Fajar Nugroho', airportId: 'ID Rifim Airport Balikpapan', attendance: 95, queueCompliance: 90, pickupActivity: 93, responseTime: 88, violation: 95, totalScore: 92.5, grade: 'A' },
  { driverId: 'drv-07', driverName: 'Gunawan Setiawan', airportId: 'ID Rifim Airport Balikpapan', attendance: 88, queueCompliance: 84, pickupActivity: 86, responseTime: 82, violation: 92, totalScore: 86.4, grade: 'B' },
  { driverId: 'drv-08', driverName: 'Hendra Kusuma', airportId: 'ID Rifim Airport Balikpapan', attendance: 78, queueCompliance: 76, pickupActivity: 74, responseTime: 80, violation: 85, totalScore: 77.6, grade: 'C' },
  { driverId: 'drv-09', driverName: 'Irwan Hidayat', airportId: 'ID Rifim Airport Balikpapan', attendance: 99, queueCompliance: 98, pickupActivity: 99, responseTime: 97, violation: 100, totalScore: 98.7, grade: 'A+' },
  { driverId: 'drv-10', driverName: 'Joko Susanto', airportId: 'ID Rifim Airport Balikpapan', attendance: 82, queueCompliance: 78, pickupActivity: 80, responseTime: 76, violation: 88, totalScore: 80.0, grade: 'B' },
  { driverId: 'drv-11', driverName: 'Ketut Suardana', airportId: 'ID Rifim Airport Pekanbaru', attendance: 94, queueCompliance: 92, pickupActivity: 95, responseTime: 91, violation: 96, totalScore: 93.8, grade: 'A' },
  { driverId: 'drv-12', driverName: 'Luh Putu Sari', airportId: 'ID Rifim Airport Pekanbaru', attendance: 90, queueCompliance: 87, pickupActivity: 89, responseTime: 85, violation: 93, totalScore: 89.0, grade: 'B' },
  { driverId: 'drv-13', driverName: 'Made Subrata', airportId: 'ID Rifim Airport Pekanbaru', attendance: 72, queueCompliance: 70, pickupActivity: 65, responseTime: 68, violation: 78, totalScore: 69.9, grade: 'C' },
  { driverId: 'drv-14', driverName: 'Nyoman Artana', airportId: 'ID Rifim Airport Pekanbaru', attendance: 97, queueCompliance: 95, pickupActivity: 98, responseTime: 94, violation: 99, totalScore: 96.9, grade: 'A+' },
  { driverId: 'drv-15', driverName: 'Putu Agus Wirawan', airportId: 'ID Rifim Airport Pekanbaru', attendance: 75, queueCompliance: 73, pickupActivity: 71, responseTime: 70, violation: 82, totalScore: 73.1, grade: 'C' },
]

export const REPORT_DATA = {
  daily: {
    labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
    pickups: [5, 12, 18, 22, 15, 20, 25],
    queues: [3, 8, 14, 18, 12, 16, 20],
  },
  weekly: {
    labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    pickups: [85, 92, 78, 105, 118, 134, 98],
    queues: [70, 80, 65, 90, 100, 115, 85],
  },
  monthly: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    pickups: [1850, 1920, 2100, 1980, 2250, 2180],
    queues: [1600, 1700, 1850, 1750, 1990, 1920],
  },
}

export const NATIONAL_STATS = {
  totalAirports: 7,
  totalDriversOnline: 63,
  totalQueuesToday: 41,
  totalPickupsToday: 168,
  airportPickups: [34, 21, 42, 28, 25, 10, 8],
  airportNames: ['Batam', 'Jambi', 'Balikpapan', 'Manado', 'Pekanbaru', 'Batam Luar', 'Jambi Luar'],
}

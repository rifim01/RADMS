// ============================================================
// MOCK DATA - RADMS (RIFIM Airport Driver Management System)
// ============================================================

export const AIRPORTS = [
  {
    id: 'apt-1',
    code: 'UPG',
    name: 'Sultan Hasanuddin',
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    fullName: 'Bandar Udara Sultan Hasanuddin Makassar',
    lat: -5.0617,
    lng: 119.5543,
    driversOnline: 18,
    queueCount: 12,
    staffActive: 4,
    totalPickupsToday: 47,
    status: 'active',
    createdAt: '2023-01-15',
  },
  {
    id: 'apt-2',
    code: 'CGK',
    name: 'Soekarno-Hatta',
    city: 'Jakarta',
    province: 'Banten',
    fullName: 'Bandar Udara Internasional Soekarno-Hatta Jakarta',
    lat: -6.1256,
    lng: 106.6558,
    driversOnline: 35,
    queueCount: 28,
    staffActive: 8,
    totalPickupsToday: 112,
    status: 'active',
    createdAt: '2023-01-10',
  },
  {
    id: 'apt-3',
    code: 'DPS',
    name: 'Ngurah Rai',
    city: 'Bali',
    province: 'Bali',
    fullName: 'Bandar Udara Internasional I Gusti Ngurah Rai Bali',
    lat: -8.7482,
    lng: 115.1672,
    driversOnline: 22,
    queueCount: 15,
    staffActive: 5,
    totalPickupsToday: 68,
    status: 'active',
    createdAt: '2023-01-12',
  },
]

export const DRIVERS = [
  { id: 'drv-01', name: 'Ahmad Fauzi', nik: '7371011234560001', phone: '081234567890', vehicle: 'Toyota Avanza', plateNumber: 'DD 1234 AB', airportId: 'apt-1', status: 'online', lastLat: -5.0620, lastLng: 119.5550, speed: 0, lastSeen: '2026-06-10T08:30:00', totalPickups: 312, rating: 4.8, joinDate: '2022-03-10' },
  { id: 'drv-02', name: 'Budi Santoso', nik: '7371021234560002', phone: '081234567891', vehicle: 'Suzuki Ertiga', plateNumber: 'DD 5678 CD', airportId: 'apt-1', status: 'online', lastLat: -5.0630, lastLng: 119.5560, speed: 23, lastSeen: '2026-06-10T08:31:00', totalPickups: 245, rating: 4.6, joinDate: '2022-05-15' },
  { id: 'drv-03', name: 'Chandra Wijaya', nik: '7371031234560003', phone: '081234567892', vehicle: 'Daihatsu Xenia', plateNumber: 'DD 9012 EF', airportId: 'apt-1', status: 'offline', lastLat: -5.0610, lastLng: 119.5530, speed: 0, lastSeen: '2026-06-10T06:15:00', totalPickups: 178, rating: 4.5, joinDate: '2022-07-20' },
  { id: 'drv-04', name: 'Deni Prasetyo', nik: '7371041234560004', phone: '081234567893', vehicle: 'Mitsubishi Xpander', plateNumber: 'DD 3456 GH', airportId: 'apt-1', status: 'online', lastLat: -5.0640, lastLng: 119.5570, speed: 15, lastSeen: '2026-06-10T08:32:00', totalPickups: 420, rating: 4.9, joinDate: '2021-11-05' },
  { id: 'drv-05', name: 'Eko Wahyudi', nik: '7371051234560005', phone: '081234567894', vehicle: 'Honda Mobilio', plateNumber: 'DD 7890 IJ', airportId: 'apt-1', status: 'offline', lastLat: -5.0600, lastLng: 119.5520, speed: 0, lastSeen: '2026-06-10T07:00:00', totalPickups: 156, rating: 4.3, joinDate: '2023-01-18' },
  { id: 'drv-06', name: 'Fajar Nugroho', nik: '3171061234560006', phone: '081234567895', vehicle: 'Toyota Calya', plateNumber: 'B 1234 KL', airportId: 'apt-2', status: 'online', lastLat: -6.1260, lastLng: 106.6560, speed: 30, lastSeen: '2026-06-10T08:33:00', totalPickups: 534, rating: 4.7, joinDate: '2021-06-12' },
  { id: 'drv-07', name: 'Gunawan Setiawan', nik: '3171071234560007', phone: '081234567896', vehicle: 'Suzuki APV', plateNumber: 'B 5678 MN', airportId: 'apt-2', status: 'online', lastLat: -6.1270, lastLng: 106.6570, speed: 0, lastSeen: '2026-06-10T08:34:00', totalPickups: 389, rating: 4.5, joinDate: '2021-09-20' },
  { id: 'drv-08', name: 'Hendra Kusuma', nik: '3171081234560008', phone: '081234567897', vehicle: 'Toyota Avanza', plateNumber: 'B 9012 OP', airportId: 'apt-2', status: 'offline', lastLat: -6.1240, lastLng: 106.6540, speed: 0, lastSeen: '2026-06-10T05:30:00', totalPickups: 267, rating: 4.4, joinDate: '2022-02-14' },
  { id: 'drv-09', name: 'Irwan Hidayat', nik: '3171091234560009', phone: '081234567898', vehicle: 'Mitsubishi Outlander', plateNumber: 'B 3456 QR', airportId: 'apt-2', status: 'online', lastLat: -6.1280, lastLng: 106.6580, speed: 45, lastSeen: '2026-06-10T08:35:00', totalPickups: 611, rating: 4.9, joinDate: '2020-12-01' },
  { id: 'drv-10', name: 'Joko Susanto', nik: '3171101234560010', phone: '081234567899', vehicle: 'Daihatsu Sigra', plateNumber: 'B 7890 ST', airportId: 'apt-2', status: 'online', lastLat: -6.1250, lastLng: 106.6550, speed: 10, lastSeen: '2026-06-10T08:36:00', totalPickups: 298, rating: 4.6, joinDate: '2022-04-08' },
  { id: 'drv-11', name: 'Ketut Suardana', nik: '5171111234560011', phone: '081234567800', vehicle: 'Toyota Kijang Innova', plateNumber: 'DK 1234 UV', airportId: 'apt-3', status: 'online', lastLat: -8.7490, lastLng: 115.1680, speed: 20, lastSeen: '2026-06-10T08:37:00', totalPickups: 445, rating: 4.8, joinDate: '2021-08-15' },
  { id: 'drv-12', name: 'Luh Putu Sari', nik: '5171121234560012', phone: '081234567801', vehicle: 'Honda Freed', plateNumber: 'DK 5678 WX', airportId: 'apt-3', status: 'online', lastLat: -8.7500, lastLng: 115.1690, speed: 0, lastSeen: '2026-06-10T08:38:00', totalPickups: 332, rating: 4.7, joinDate: '2022-01-25' },
  { id: 'drv-13', name: 'Made Subrata', nik: '5171131234560013', phone: '081234567802', vehicle: 'Toyota Avanza', plateNumber: 'DK 9012 YZ', airportId: 'apt-3', status: 'offline', lastLat: -8.7470, lastLng: 115.1660, speed: 0, lastSeen: '2026-06-10T06:45:00', totalPickups: 189, rating: 4.4, joinDate: '2022-09-30' },
  { id: 'drv-14', name: 'Nyoman Artana', nik: '5171141234560014', phone: '081234567803', vehicle: 'Suzuki Ertiga', plateNumber: 'DK 3456 AA', airportId: 'apt-3', status: 'online', lastLat: -8.7510, lastLng: 115.1700, speed: 35, lastSeen: '2026-06-10T08:39:00', totalPickups: 567, rating: 4.9, joinDate: '2021-03-22' },
  { id: 'drv-15', name: 'Putu Agus Wirawan', nik: '5171151234560015', phone: '081234567804', vehicle: 'Mitsubishi Xpander', plateNumber: 'DK 7890 BB', airportId: 'apt-3', status: 'offline', lastLat: -8.7460, lastLng: 115.1650, speed: 0, lastSeen: '2026-06-10T07:30:00', totalPickups: 223, rating: 4.5, joinDate: '2022-06-17' },
]

export const STAFF = [
  { id: 'stf-01', name: 'Rini Andriani', nik: '7371011234580001', phone: '082345678901', email: 'rini@rifim.com', role: 'Airport Coordinator', airportId: 'apt-1', status: 'active', joinDate: '2021-05-10', lastCheckin: '2026-06-10T07:00:00' },
  { id: 'stf-02', name: 'Slamet Riyadi', nik: '7371021234580002', phone: '082345678902', email: 'slamet@rifim.com', role: 'Staff', airportId: 'apt-1', status: 'active', joinDate: '2022-02-14', lastCheckin: '2026-06-10T07:05:00' },
  { id: 'stf-03', name: 'Tri Wahyuningsih', nik: '3171031234580003', phone: '082345678903', email: 'tri@rifim.com', role: 'Airport Coordinator', airportId: 'apt-2', status: 'active', joinDate: '2021-08-20', lastCheckin: '2026-06-10T06:55:00' },
  { id: 'stf-04', name: 'Ujang Permana', nik: '3171041234580004', phone: '082345678904', email: 'ujang@rifim.com', role: 'Staff', airportId: 'apt-2', status: 'inactive', joinDate: '2022-11-01', lastCheckin: '2026-06-09T07:10:00' },
  { id: 'stf-05', name: 'Vivi Oktaviani', nik: '5171051234580005', phone: '082345678905', email: 'vivi@rifim.com', role: 'Airport Coordinator', airportId: 'apt-3', status: 'active', joinDate: '2021-12-05', lastCheckin: '2026-06-10T07:02:00' },
]

export const QUEUE_DATA = [
  { id: 'q-001', number: 1, driverId: 'drv-01', driverName: 'Ahmad Fauzi', plateNumber: 'DD 1234 AB', airportId: 'apt-1', status: 'PICKUP', joinedAt: '2026-06-10T07:15:00', calledAt: '2026-06-10T07:30:00', pickupPoint: 'Terminal 1 - Gate A', passengerName: 'Budi Hartono', destination: 'Hotel Aryaduta' },
  { id: 'q-002', number: 2, driverId: 'drv-02', driverName: 'Budi Santoso', plateNumber: 'DD 5678 CD', airportId: 'apt-1', status: 'CALLED', joinedAt: '2026-06-10T07:20:00', calledAt: '2026-06-10T08:15:00', pickupPoint: 'Terminal 1 - Gate B', passengerName: 'Dewi Susanti', destination: 'Jl. Pettarani No.12' },
  { id: 'q-003', number: 3, driverId: 'drv-04', driverName: 'Deni Prasetyo', plateNumber: 'DD 3456 GH', airportId: 'apt-1', status: 'WAITING', joinedAt: '2026-06-10T08:00:00', calledAt: null, pickupPoint: 'Terminal 1 - Gate C', passengerName: null, destination: null },
  { id: 'q-004', number: 4, driverId: 'drv-02', driverName: 'Budi Santoso', plateNumber: 'DD 5678 CD', airportId: 'apt-1', status: 'WAITING', joinedAt: '2026-06-10T08:10:00', calledAt: null, pickupPoint: 'Terminal 2 - Gate A', passengerName: null, destination: null },
  { id: 'q-005', number: 5, driverId: 'drv-01', driverName: 'Ahmad Fauzi', plateNumber: 'DD 1234 AB', airportId: 'apt-1', status: 'COMPLETED', joinedAt: '2026-06-10T06:00:00', calledAt: '2026-06-10T06:20:00', pickupPoint: 'Terminal 1 - Gate A', passengerName: 'Hendra Lim', destination: 'Bandara Lama' },
  { id: 'q-006', number: 1, driverId: 'drv-06', driverName: 'Fajar Nugroho', plateNumber: 'B 1234 KL', airportId: 'apt-2', status: 'PICKUP', joinedAt: '2026-06-10T07:00:00', calledAt: '2026-06-10T07:45:00', pickupPoint: 'Terminal 3 - Gate D1', passengerName: 'Rina Marlina', destination: 'Hotel Grand Hyatt' },
  { id: 'q-007', number: 2, driverId: 'drv-07', driverName: 'Gunawan Setiawan', plateNumber: 'B 5678 MN', airportId: 'apt-2', status: 'WAITING', joinedAt: '2026-06-10T07:30:00', calledAt: null, pickupPoint: 'Terminal 2 - Gate E3', passengerName: null, destination: null },
  { id: 'q-008', number: 3, driverId: 'drv-09', driverName: 'Irwan Hidayat', plateNumber: 'B 3456 QR', airportId: 'apt-2', status: 'CALLED', joinedAt: '2026-06-10T07:45:00', calledAt: '2026-06-10T08:20:00', pickupPoint: 'Terminal 1 - Gate F2', passengerName: 'Surya Dharma', destination: 'Jl. Sudirman No.50' },
  { id: 'q-009', number: 1, driverId: 'drv-11', driverName: 'Ketut Suardana', plateNumber: 'DK 1234 UV', airportId: 'apt-3', status: 'WAITING', joinedAt: '2026-06-10T08:05:00', calledAt: null, pickupPoint: 'Kedatangan Domestik', passengerName: null, destination: null },
  { id: 'q-010', number: 2, driverId: 'drv-12', driverName: 'Luh Putu Sari', plateNumber: 'DK 5678 WX', airportId: 'apt-3', status: 'PICKUP', joinedAt: '2026-06-10T07:10:00', calledAt: '2026-06-10T07:55:00', pickupPoint: 'Kedatangan Internasional', passengerName: 'John Smith', destination: 'The Seminyak Beach Resort' },
  { id: 'q-011', number: 3, driverId: 'drv-14', driverName: 'Nyoman Artana', plateNumber: 'DK 3456 AA', airportId: 'apt-3', status: 'CALLED', joinedAt: '2026-06-10T07:50:00', calledAt: '2026-06-10T08:25:00', pickupPoint: 'Kedatangan Domestik', passengerName: 'Siti Rahayu', destination: 'Ubud Palace' },
  { id: 'q-012', number: 4, driverId: 'drv-11', driverName: 'Ketut Suardana', plateNumber: 'DK 1234 UV', airportId: 'apt-3', status: 'COMPLETED', joinedAt: '2026-06-10T06:30:00', calledAt: '2026-06-10T06:50:00', pickupPoint: 'Kedatangan Domestik', passengerName: 'Wayan Budiana', destination: 'Kuta Beach Hotel' },
]

export const ATTENDANCE_RECORDS = [
  { id: 'att-001', staffId: 'stf-01', staffName: 'Rini Andriani', airportId: 'apt-1', date: '2026-06-10', checkIn: '07:00:12', checkOut: null, locationIn: '-5.0617, 119.5543', locationOut: null, status: 'hadir' },
  { id: 'att-002', staffId: 'stf-02', staffName: 'Slamet Riyadi', airportId: 'apt-1', date: '2026-06-10', checkIn: '07:05:34', checkOut: null, locationIn: '-5.0617, 119.5543', locationOut: null, status: 'hadir' },
  { id: 'att-003', staffId: 'stf-03', staffName: 'Tri Wahyuningsih', airportId: 'apt-2', date: '2026-06-10', checkIn: '06:55:21', checkOut: null, locationIn: '-6.1256, 106.6558', locationOut: null, status: 'hadir' },
  { id: 'att-004', staffId: 'stf-04', staffName: 'Ujang Permana', airportId: 'apt-2', date: '2026-06-10', checkIn: null, checkOut: null, locationIn: null, locationOut: null, status: 'tidak_hadir' },
  { id: 'att-005', staffId: 'stf-05', staffName: 'Vivi Oktaviani', airportId: 'apt-3', date: '2026-06-10', checkIn: '07:02:45', checkOut: null, locationIn: '-8.7482, 115.1672', locationOut: null, status: 'hadir' },
  { id: 'att-006', staffId: 'stf-01', staffName: 'Rini Andriani', airportId: 'apt-1', date: '2026-06-09', checkIn: '07:01:08', checkOut: '15:00:22', locationIn: '-5.0617, 119.5543', locationOut: '-5.0617, 119.5543', status: 'hadir' },
  { id: 'att-007', staffId: 'stf-02', staffName: 'Slamet Riyadi', airportId: 'apt-1', date: '2026-06-09', checkIn: '07:10:55', checkOut: '15:05:11', locationIn: '-5.0617, 119.5543', locationOut: '-5.0617, 119.5543', status: 'terlambat' },
  { id: 'att-008', staffId: 'stf-03', staffName: 'Tri Wahyuningsih', airportId: 'apt-2', date: '2026-06-09', checkIn: '06:58:33', checkOut: '15:02:17', locationIn: '-6.1256, 106.6558', locationOut: '-6.1256, 106.6558', status: 'hadir' },
]

export const KPI_DATA = [
  { driverId: 'drv-01', driverName: 'Ahmad Fauzi', airportId: 'apt-1', attendance: 92, queueCompliance: 88, pickupActivity: 95, responseTime: 90, violation: 95, totalScore: 92.4, grade: 'A' },
  { driverId: 'drv-02', driverName: 'Budi Santoso', airportId: 'apt-1', attendance: 85, queueCompliance: 80, pickupActivity: 82, responseTime: 78, violation: 90, totalScore: 83.1, grade: 'B' },
  { driverId: 'drv-03', driverName: 'Chandra Wijaya', airportId: 'apt-1', attendance: 70, queueCompliance: 72, pickupActivity: 68, responseTime: 75, violation: 80, totalScore: 72.2, grade: 'C' },
  { driverId: 'drv-04', driverName: 'Deni Prasetyo', airportId: 'apt-1', attendance: 98, queueCompliance: 95, pickupActivity: 97, responseTime: 96, violation: 100, totalScore: 97.0, grade: 'A+' },
  { driverId: 'drv-05', driverName: 'Eko Wahyudi', airportId: 'apt-1', attendance: 60, queueCompliance: 65, pickupActivity: 58, responseTime: 62, violation: 70, totalScore: 62.6, grade: 'D' },
  { driverId: 'drv-06', driverName: 'Fajar Nugroho', airportId: 'apt-2', attendance: 95, queueCompliance: 90, pickupActivity: 93, responseTime: 88, violation: 95, totalScore: 92.5, grade: 'A' },
  { driverId: 'drv-07', driverName: 'Gunawan Setiawan', airportId: 'apt-2', attendance: 88, queueCompliance: 84, pickupActivity: 86, responseTime: 82, violation: 92, totalScore: 86.4, grade: 'B' },
  { driverId: 'drv-08', driverName: 'Hendra Kusuma', airportId: 'apt-2', attendance: 78, queueCompliance: 76, pickupActivity: 74, responseTime: 80, violation: 85, totalScore: 77.6, grade: 'C' },
  { driverId: 'drv-09', driverName: 'Irwan Hidayat', airportId: 'apt-2', attendance: 99, queueCompliance: 98, pickupActivity: 99, responseTime: 97, violation: 100, totalScore: 98.7, grade: 'A+' },
  { driverId: 'drv-10', driverName: 'Joko Susanto', airportId: 'apt-2', attendance: 82, queueCompliance: 78, pickupActivity: 80, responseTime: 76, violation: 88, totalScore: 80.0, grade: 'B' },
  { driverId: 'drv-11', driverName: 'Ketut Suardana', airportId: 'apt-3', attendance: 94, queueCompliance: 92, pickupActivity: 95, responseTime: 91, violation: 96, totalScore: 93.8, grade: 'A' },
  { driverId: 'drv-12', driverName: 'Luh Putu Sari', airportId: 'apt-3', attendance: 90, queueCompliance: 87, pickupActivity: 89, responseTime: 85, violation: 93, totalScore: 89.0, grade: 'B' },
  { driverId: 'drv-13', driverName: 'Made Subrata', airportId: 'apt-3', attendance: 72, queueCompliance: 70, pickupActivity: 65, responseTime: 68, violation: 78, totalScore: 69.9, grade: 'C' },
  { driverId: 'drv-14', driverName: 'Nyoman Artana', airportId: 'apt-3', attendance: 97, queueCompliance: 95, pickupActivity: 98, responseTime: 94, violation: 99, totalScore: 96.9, grade: 'A+' },
  { driverId: 'drv-15', driverName: 'Putu Agus Wirawan', airportId: 'apt-3', attendance: 75, queueCompliance: 73, pickupActivity: 71, responseTime: 70, violation: 82, totalScore: 73.1, grade: 'C' },
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
  totalAirports: 3,
  totalDriversOnline: 75,
  totalQueuesToday: 55,
  totalPickupsToday: 227,
  airportPickups: [47, 112, 68],
  airportNames: ['Sultan Hasanuddin', 'Soekarno-Hatta', 'Ngurah Rai'],
}

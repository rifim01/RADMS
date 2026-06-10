/**
 * Format tanggal ke format Indonesia
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format tanggal pendek
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format waktu
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format tanggal dan waktu lengkap
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format waktu relatif (misal: "2 menit lalu")
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDateShort(date);
}

/**
 * Format nomor antrian dengan padding
 * @param {number} number
 * @returns {string}
 */
export function formatQueueNumber(number) {
  return String(number).padStart(3, '0');
}

/**
 * Format nomor telepon Indonesia
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  return phone;
}

/**
 * Translate status antrian ke Bahasa Indonesia
 * @param {string} status
 * @returns {string}
 */
export function translateStatus(status) {
  const statusMap = {
    WAITING: 'Menunggu',
    CALLED: 'Dipanggil',
    PICKUP: 'Penjemputan',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    OFFLINE: 'Offline',
    ONLINE: 'Online',
  };
  return statusMap[status] || status;
}

/**
 * Format kecepatan
 * @param {number} speed - kecepatan dalam m/s
 * @returns {string}
 */
export function formatSpeed(speed) {
  const kmh = speed * 3.6;
  return `${Math.round(kmh)} km/jam`;
}

/**
 * Format durasi dalam menit
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} jam`;
  return `${hours} jam ${mins} menit`;
}

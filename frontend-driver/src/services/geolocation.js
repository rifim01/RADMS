// ============================================================
// Geolocation Service - Layanan GPS untuk RADMS Driver
// ============================================================

const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

// Minimum accuracy threshold — reject positions worse than this (meters)
const MAX_ACCURACY_METERS = 150;

let watchId = null;

/**
 * Mendapatkan posisi saat ini sekali
 * @returns {Promise<GeolocationPosition>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser ini'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, LOCATION_OPTIONS);
  });
}

/**
 * Memulai pemantauan posisi secara real-time
 * @param {Function} onUpdate - Callback saat posisi berubah
 * @param {Function} onError - Callback saat error
 * @param {number} intervalMs - Interval update dalam ms (default 15 detik)
 * @returns {Function} Fungsi untuk menghentikan pemantauan
 */
export function startLocationTracking(onUpdate, onError) {
  if (!navigator.geolocation) {
    onError?.(new Error('Geolocation tidak didukung oleh browser ini'));
    return () => {};
  }

  // watchPosition only — no competing interval (prevents GPS jitter)
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      // Reject inaccurate fixes to prevent GPS jumping
      if (position.coords.accuracy > MAX_ACCURACY_METERS) {
        console.warn('[GPS] Akurasi rendah, dilewati:', Math.round(position.coords.accuracy), 'm');
        return;
      }
      onUpdate?.(extractLocationData(position));
    },
    (error) => {
      onError?.(new Error(getGeolocationErrorMessage(error)));
    },
    LOCATION_OPTIONS
  );

  return () => stopLocationTracking();
}

/**
 * Menghentikan pemantauan posisi
 */
export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation?.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Ekstrak data lokasi dari GeolocationPosition
 * @param {GeolocationPosition} position
 * @returns {Object}
 */
function extractLocationData(position) {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed || 0,
    heading: position.coords.heading,
    altitude: position.coords.altitude,
    timestamp: position.timestamp,
  };
}

/**
 * Mendapatkan pesan error geolocation yang ramah pengguna
 * @param {GeolocationPositionError} error
 * @returns {string}
 */
function getGeolocationErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Izin lokasi ditolak. Harap aktifkan izin lokasi di pengaturan browser.';
    case error.POSITION_UNAVAILABLE:
      return 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
    case error.TIMEOUT:
      return 'Permintaan lokasi timeout. Coba lagi.';
    default:
      return 'Terjadi kesalahan saat mengambil lokasi.';
  }
}

/**
 * Cek apakah geolocation tersedia
 * @returns {boolean}
 */
export function isGeolocationAvailable() {
  return 'geolocation' in navigator;
}

/**
 * Minta izin geolocation
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt'
 */
export async function requestLocationPermission() {
  if (!navigator.permissions) {
    // Fallback: coba getCurrentPosition untuk trigger permission dialog
    try {
      await getCurrentPosition();
      return 'granted';
    } catch {
      return 'denied';
    }
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'prompt';
  }
}

/**
 * Simulasi lokasi (untuk development/demo)
 * Berjalan di sekitar Bandara Sultan Hasanuddin
 * @param {Function} onUpdate
 * @returns {Function} stop function
 */
export function startSimulatedTracking(onUpdate) {
  const centerLat = -5.0614;
  const centerLng = 119.5542;
  let angle = 0;
  const radius = 0.002; // ~200 meter

  const interval = setInterval(() => {
    angle += 0.05;
    const lat = centerLat + Math.cos(angle) * radius;
    const lng = centerLng + Math.sin(angle) * radius;

    onUpdate?.({
      lat,
      lng,
      accuracy: 10,
      speed: 5 + Math.random() * 3,
      heading: (angle * 180) / Math.PI,
      altitude: null,
      timestamp: Date.now(),
      simulated: true,
    });
  }, 3000);

  return () => clearInterval(interval);
}

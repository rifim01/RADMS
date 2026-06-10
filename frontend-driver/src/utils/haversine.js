/**
 * Haversine formula - menghitung jarak antara dua koordinat GPS
 * @param {number} lat1 - Latitude titik pertama
 * @param {number} lon1 - Longitude titik pertama
 * @param {number} lat2 - Latitude titik kedua
 * @param {number} lon2 - Longitude titik kedua
 * @returns {number} Jarak dalam meter
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam meter
}

/**
 * Mengecek apakah koordinat berada dalam radius geofence
 * @param {number} lat - Latitude posisi saat ini
 * @param {number} lon - Longitude posisi saat ini
 * @param {number} centerLat - Latitude pusat geofence
 * @param {number} centerLon - Longitude pusat geofence
 * @param {number} radiusMeters - Radius geofence dalam meter
 * @returns {boolean}
 */
export function isWithinGeofence(lat, lon, centerLat, centerLon, radiusMeters) {
  const distance = haversineDistance(lat, lon, centerLat, centerLon);
  return distance <= radiusMeters;
}

/**
 * Format jarak ke format yang mudah dibaca
 * @param {number} meters - Jarak dalam meter
 * @returns {string}
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Menghitung bearing (arah) dari titik A ke titik B
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Bearing dalam derajat (0-360)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

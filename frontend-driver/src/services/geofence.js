// ============================================================
// Geofence Service - Deteksi geofence bandara menggunakan Haversine
// ============================================================

import { haversineDistance, isWithinGeofence } from '../utils/haversine.js';
import { AIRPORTS } from './mockData.js';

/**
 * Cek apakah driver berada di dalam geofence bandara
 * @param {number} lat
 * @param {number} lng
 * @param {string} airportId
 * @returns {{ inside: boolean, distance: number, airport: Object }}
 */
export function checkGeofence(lat, lng, airportId) {
  const airport = AIRPORTS[airportId];
  if (!airport) {
    return { inside: false, distance: Infinity, airport: null };
  }

  const distance = haversineDistance(lat, lng, airport.lat, airport.lng);
  const inside = distance <= airport.geofenceRadius;

  return {
    inside,
    distance,
    airport,
    geofenceRadius: airport.geofenceRadius,
  };
}

/**
 * Geofence monitor - memantau masuk/keluar geofence
 */
export class GeofenceMonitor {
  constructor(airportId, onEnter, onExit) {
    this.airportId = airportId;
    this.onEnter = onEnter;
    this.onExit = onExit;
    this.wasInside = false;
    this.lastStatus = null;
  }

  /**
   * Update posisi dan cek geofence
   * @param {number} lat
   * @param {number} lng
   */
  update(lat, lng) {
    const result = checkGeofence(lat, lng, this.airportId);

    if (result.inside && !this.wasInside) {
      // Masuk geofence
      this.wasInside = true;
      this.lastStatus = { ...result, event: 'ENTER', timestamp: Date.now() };
      this.onEnter?.(result);
    } else if (!result.inside && this.wasInside) {
      // Keluar geofence
      this.wasInside = false;
      this.lastStatus = { ...result, event: 'EXIT', timestamp: Date.now() };
      this.onExit?.(result);
    }

    return { ...result, wasInside: this.wasInside };
  }

  /**
   * Reset status
   */
  reset() {
    this.wasInside = false;
    this.lastStatus = null;
  }
}

/**
 * Mendapatkan nama zona terdekat di bandara
 * @param {number} lat
 * @param {number} lng
 * @param {string} airportId
 * @returns {string|null}
 */
export function getNearestZone(lat, lng, airportId) {
  const airport = AIRPORTS[airportId];
  if (!airport?.zones) return null;

  let nearestZone = null;
  let minDistance = Infinity;

  for (const zone of airport.zones) {
    const dist = haversineDistance(lat, lng, zone.lat, zone.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestZone = zone;
    }
  }

  return nearestZone;
}

/**
 * Hitung estimasi waktu tunggu berdasarkan posisi antrian
 * @param {number} queuePosition - Posisi dalam antrian (1-based)
 * @param {number} avgServiceMinutes - Rata-rata waktu layanan per kendaraan
 * @returns {number} Estimasi menit
 */
export function estimateWaitTime(queuePosition, avgServiceMinutes = 8) {
  return Math.max(0, (queuePosition - 1) * avgServiceMinutes);
}

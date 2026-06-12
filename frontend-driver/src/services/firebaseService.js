import { ref, set, onValue, off, push, serverTimestamp, update } from 'firebase/database'
import { signInAnonymously } from 'firebase/auth'
import { db, auth } from '../firebase/config'

// Ensure anonymous Firebase auth so RTDB rules work
export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  return auth.currentUser
}

// ─── GPS Location ────────────────────────────────────────────────────────────
export function updateDriverLocation(driverId, branchId, lat, lng, isOnline) {
  const r = ref(db, `drivers/${driverId}/location`)
  return set(r, {
    lat,
    lng,
    branchId,
    isOnline,
    updatedAt: serverTimestamp(),
  })
}

export function setDriverOnlineStatus(driverId, isOnline) {
  return update(ref(db, `drivers/${driverId}`), {
    isOnline,
    lastSeen: serverTimestamp(),
  })
}

// ─── Queue ───────────────────────────────────────────────────────────────────
export function joinQueue(driverId, driverName, plateNumber, branchId) {
  const r = ref(db, `queue/${branchId}/${driverId}`)
  return set(r, {
    driverId,
    driverName,
    plateNumber,
    branchId,
    status: 'WAITING',
    joinedAt: serverTimestamp(),
    calledAt: null,
  })
}

export function leaveQueue(driverId, branchId) {
  return set(ref(db, `queue/${branchId}/${driverId}`), null)
}

export function markQueuePickup(driverId, branchId) {
  return update(ref(db, `queue/${branchId}/${driverId}`), {
    status: 'PICKUP',
    pickedUpAt: serverTimestamp(),
  })
}

export function completeQueueEntry(driverId, branchId) {
  return set(ref(db, `queue/${branchId}/${driverId}`), null)
}

export function recordTripCompletion(driverId, driverName, branchId, plateNumber) {
  return push(ref(db, `trips/${driverId}`), {
    driverId,
    driverName,
    branchId,
    plateNumber: plateNumber || '',
    status: 'COMPLETED',
    startTime: serverTimestamp(),
    endTime: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}

export function listenQueue(branchId, callback) {
  const r = ref(db, `queue/${branchId}`)
  onValue(r, snap => {
    const val = snap.val() || {}
    const entries = Object.values(val).sort((a, b) => {
      // Sort by joinedAt ascending (FIFO)
      const ta = a.joinedAt || 0
      const tb = b.joinedAt || 0
      return ta - tb
    })
    callback(entries)
  })
  return () => off(r)
}

export function listenMyQueueStatus(driverId, branchId, callback) {
  const r = ref(db, `queue/${branchId}/${driverId}`)
  onValue(r, snap => callback(snap.val()))
  return () => off(r)
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function listenNotifications(driverId, callback) {
  const r = ref(db, `notifications/${driverId}`)
  onValue(r, snap => {
    const val = snap.val() || {}
    const list = Object.entries(val).map(([id, n]) => ({ id, ...n }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    callback(list)
  })
  return () => off(r)
}

export function markNotificationRead(driverId, notifId) {
  return update(ref(db, `notifications/${driverId}/${notifId}`), { read: true })
}

// ─── Panic ───────────────────────────────────────────────────────────────────
export function sendPanic(driverId, driverName, branchId, lat, lng) {
  return push(ref(db, `panic`), {
    driverId,
    driverName,
    branchId,
    lat,
    lng,
    sentAt: serverTimestamp(),
    handled: false,
  })
}

// ─── Trips / Riwayat ─────────────────────────────────────────────────────────
export function listenDriverTrips(driverId, callback) {
  const r = ref(db, `trips/${driverId}`)
  onValue(r, snap => {
    const val = snap.val() || {}
    const list = Object.entries(val).map(([id, t]) => ({ id, ...t }))
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
    callback(list)
  })
  return () => off(r)
}

export function recordTrip(driverId, tripData) {
  return push(ref(db, `trips/${driverId}`), {
    ...tripData,
    createdAt: serverTimestamp(),
  })
}

// ─── Staff Validation ─────────────────────────────────────────────────────────
export function recordValidation(driverId, driverName, branchId, staffId, staffName) {
  return push(ref(db, `validations/${branchId}`), {
    driverId,
    driverName,
    branchId,
    staffId,
    staffName,
    validatedAt: serverTimestamp(),
  })
}

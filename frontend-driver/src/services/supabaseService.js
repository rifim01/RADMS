import { supabase } from '../supabase/config.js'

// ─── GPS Location ─────────────────────────────────────────────────────────────
export async function updateDriverLocation(driverId, branchId, lat, lng, isOnline) {
  return supabase
    .from('driver_locations')
    .upsert({ driver_id: driverId, branch_id: branchId, lat, lng, is_online: isOnline, updated_at: new Date().toISOString() })
}

export async function setDriverOnlineStatus(driverId, isOnline) {
  return supabase
    .from('drivers')
    .upsert({ driver_id: driverId, is_online: isOnline, last_seen: new Date().toISOString() })
}

// ─── Queue ───────────────────────────────────────────────────────────────────
export async function joinQueue(driverId, driverName, plateNumber, branchId) {
  return supabase
    .from('queue')
    .upsert({
      driver_id: driverId,
      driver_name: driverName,
      plate_number: plateNumber,
      branch_id: branchId,
      status: 'WAITING',
      joined_at: new Date().toISOString(),
      called_at: null,
    })
}

export async function leaveQueue(driverId, branchId) {
  return supabase
    .from('queue')
    .delete()
    .eq('driver_id', driverId)
    .eq('branch_id', branchId)
}

export function listenQueue(branchId, callback) {
  // Initial fetch
  supabase
    .from('queue')
    .select('*')
    .eq('branch_id', branchId)
    .order('joined_at', { ascending: true })
    .then(({ data }) => callback(data || []))

  // Real-time subscription
  const channel = supabase
    .channel(`queue:${branchId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue', filter: `branch_id=eq.${branchId}` }, () => {
      supabase
        .from('queue')
        .select('*')
        .eq('branch_id', branchId)
        .order('joined_at', { ascending: true })
        .then(({ data }) => callback(data || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function listenMyQueueStatus(driverId, branchId, callback) {
  // Initial fetch
  supabase
    .from('queue')
    .select('*')
    .eq('driver_id', driverId)
    .eq('branch_id', branchId)
    .maybeSingle()
    .then(({ data }) => callback(data))

  // Real-time subscription
  const channel = supabase
    .channel(`queue:${branchId}:${driverId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'queue',
      filter: `driver_id=eq.${driverId}`,
    }, (payload) => {
      if (payload.eventType === 'DELETE') {
        callback(null)
      } else {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function listenNotifications(driverId, callback) {
  supabase
    .from('notifications')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .then(({ data }) => callback(data || []))

  const channel = supabase
    .channel(`notif:${driverId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `driver_id=eq.${driverId}` }, (payload) => {
      supabase
        .from('notifications')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .then(({ data }) => callback(data || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function markNotificationRead(driverId, notifId) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId)
    .eq('driver_id', driverId)
}

// ─── Panic ───────────────────────────────────────────────────────────────────
export async function sendPanic(driverId, driverName, branchId, lat, lng) {
  return supabase
    .from('panic')
    .insert({ driver_id: driverId, driver_name: driverName, branch_id: branchId, lat, lng, sent_at: new Date().toISOString() })
}

// ─── Trips / Riwayat ─────────────────────────────────────────────────────────
export function listenDriverTrips(driverId, callback) {
  supabase
    .from('trips')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .then(({ data }) => callback(data || []))

  const channel = supabase
    .channel(`trips:${driverId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips', filter: `driver_id=eq.${driverId}` }, () => {
      supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .then(({ data }) => callback(data || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function recordTrip(driverId, tripData) {
  return supabase
    .from('trips')
    .insert({ driver_id: driverId, ...tripData, created_at: new Date().toISOString() })
}

// ─── Staff Validation ─────────────────────────────────────────────────────────
export async function recordValidation(driverId, driverName, branchId, staffId, staffName) {
  return supabase
    .from('validations')
    .insert({ driver_id: driverId, driver_name: driverName, branch_id: branchId, staff_id: staffId, staff_name: staffName })
}

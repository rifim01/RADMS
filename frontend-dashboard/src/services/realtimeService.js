// ============================================================
// REALTIME SERVICE — Dashboard side
// Reads/writes the same Supabase tables the driver app uses,
// so the two RADMS apps stay connected in real time.
// ============================================================
import { supabase } from '../supabase/config'

// ─── Driver online status (radms_drivers) ──────────────────────────────
// Keyed by driver_id (= NIK), written by driver app's setDriverOnlineStatus()
export function listenAllDriverStatus(callback) {
  const fetchAll = () =>
    supabase.from('radms_drivers').select('*').then(({ data }) => callback(data || []))
  fetchAll()
  const channel = supabase
    .channel('dash_radms_drivers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'radms_drivers' }, fetchAll)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ─── Driver GPS locations (radms_driver_locations) ─────────────────────
// Keyed by driver_id (= NIK), written by driver app's updateDriverLocation()
export function listenAllDriverLocations(callback) {
  const fetchAll = () =>
    supabase.from('radms_driver_locations').select('*').then(({ data }) => callback(data || []))
  fetchAll()
  const channel = supabase
    .channel('dash_radms_driver_locations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'radms_driver_locations' }, fetchAll)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ─── Queue (table: queue) ───────────────────────────────────────────────
function mapQueueRow(row) {
  return {
    driverId: row.driver_id,
    driverName: row.driver_name,
    branchId: row.branch_id,
    plateNumber: row.plate_number,
    status: row.status,
    joinedAt: row.joined_at,
    calledAt: row.called_at,
  }
}

export function listenQueueByBranch(branchId, callback) {
  const fetchQueue = () =>
    supabase
      .from('queue')
      .select('*')
      .eq('branch_id', branchId)
      .order('joined_at', { ascending: true })
      .then(({ data }) => callback((data || []).map(mapQueueRow)))

  fetchQueue()
  const channel = supabase
    .channel(`dash_queue:${branchId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue', filter: `branch_id=eq.${branchId}` }, fetchQueue)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function updateQueueStatus(branchId, driverId, newStatus) {
  if (newStatus === 'COMPLETED') {
    // Snapshot the queue entry into trips history before clearing its status
    const { data: row } = await supabase
      .from('queue')
      .select('*')
      .eq('branch_id', branchId)
      .eq('driver_id', driverId)
      .maybeSingle()
    if (row) {
      await supabase.from('trips').insert({
        driver_id: row.driver_id,
        driver_name: row.driver_name,
        branch_id: row.branch_id,
        plate_number: row.plate_number,
        status: 'COMPLETED',
        start_time: row.joined_at,
        end_time: new Date().toISOString(),
      })
    }
  }
  return supabase
    .from('queue')
    .update({
      status: newStatus,
      called_at: newStatus === 'CALLED' ? new Date().toISOString() : null,
    })
    .eq('branch_id', branchId)
    .eq('driver_id', driverId)
}

export async function removeFromQueue(branchId, driverId) {
  return supabase.from('queue').delete().eq('branch_id', branchId).eq('driver_id', driverId)
}

// Staff calling a driver directly that isn't in the queue yet (DriversPage "Panggil" button)
export async function callDriverToQueue(branchId, driverId, driverName, plateNumber) {
  return supabase.from('queue').upsert({
    driver_id: driverId,
    driver_name: driverName,
    branch_id: branchId,
    plate_number: plateNumber || '',
    status: 'CALLED',
    joined_at: new Date().toISOString(),
    called_at: new Date().toISOString(),
  }, { onConflict: 'driver_id,branch_id' })
}

// ─── Trips (table: trips) ───────────────────────────────────────────────
export function listenAllTrips(callback) {
  const fetchAll = () =>
    supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => callback(data || []))

  fetchAll()
  const channel = supabase
    .channel('dash_trips_all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchAll)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ─── Panic alerts (table: panic) ───────────────────────────────────────
export function listenPanicAlerts(callback) {
  const fetchAll = () =>
    supabase
      .from('panic')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)
      .then(({ data }) => callback(data || []))

  fetchAll()
  const channel = supabase
    .channel('dash_panic_all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'panic' }, fetchAll)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function markPanicHandled(id) {
  return supabase.from('panic').update({ handled: true }).eq('id', id)
}

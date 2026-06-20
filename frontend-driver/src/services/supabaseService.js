import { supabase } from '../supabase/config.js'

// âââ GPS Location ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const updateDriverLocation = async (driverId, branchId, lat, lng, isOnline, speed = 0) => {
  return supabase
    .from('radms_driver_locations')
    .upsert({ driver_id: driverId, branch_id: branchId, lat, lng, is_online: isOnline, speed, updated_at: new Date().toISOString() })
}

const setDriverOnlineStatus = async (driverId, isOnline) => {
  return supabase
    .from('radms_drivers')
    .upsert({ driver_id: driverId, is_online: isOnline, last_seen: new Date().toISOString() })
}

// âââ Queue âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const joinQueue = async (driverId, driverName, plateNumber, branchId) => {
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
    }, { onConflict: 'driver_id,branch_id' })
}

const leaveQueue = async (driverId, branchId) => {
  return supabase
    .from('queue')
    .delete()
    .eq('driver_id', driverId)
    .eq('branch_id', branchId)
}

const listenQueue = (branchId, callback) => {
  supabase
    .from('queue')
    .select('*')
    .eq('branch_id', branchId)
    .order('joined_at', { ascending: true })
    .then(({ data }) => callback(data || []))

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

const listenMyQueueStatus = (driverId, branchId, callback) => {
  supabase
    .from('queue')
    .select('*')
    .eq('driver_id', driverId)
    .eq('branch_id', branchId)
    .maybeSingle()
    .then(({ data }) => callback(data))

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

// âââ Notifications âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const listenNotifications = (driverId, callback) => {
  supabase
    .from('radms_notifications')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .then(({ data }) => callback(data || []))

  const channel = supabase
    .channel(`notif:${driverId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radms_notifications', filter: `driver_id=eq.${driverId}` }, () => {
      supabase
        .from('radms_notifications')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .then(({ data }) => callback(data || []))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

const markNotificationRead = async (driverId, notifId) => {
  return supabase
    .from('radms_notifications')
    .update({ read: true })
    .eq('id', notifId)
    .eq('driver_id', driverId)
}

// âââ Panic âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const sendPanic = async (driverId, driverName, branchId, lat, lng) => {
  return supabase
    .from('panic')
    .insert({ driver_id: driverId, driver_name: driverName, branch_id: branchId, lat, lng, sent_at: new Date().toISOString() })
}

// âââ Trips / Riwayat ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const listenDriverTrips = (driverId, callback) => {
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

const recordTrip = async (driverId, tripData) => {
  return supabase
    .from('trips')
    .insert({ driver_id: driverId, ...tripData, created_at: new Date().toISOString() })
}

// âââ Staff Validation âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const recordValidation = async (driverId, driverName, branchId, staffId, staffName) => {
  return supabase
    .from('validations')
    .insert({ driver_id: driverId, driver_name: driverName, branch_id: branchId, staff_id: staffId, staff_name: staffName })
}

export {
  updateDriverLocation,
  setDriverOnlineStatus,
  joinQueue,
  leaveQueue,
  listenQueue,
  listenMyQueueStatus,
  listenNotifications,
  markNotificationRead,
  sendPanic,
  listenDriverTrips,
  recordTrip,
  recordValidation,
}

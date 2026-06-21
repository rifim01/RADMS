import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  startLocationTracking,
  stopLocationTracking,
  isGeolocationAvailable,
} from '../services/geolocation.js';
import { GeofenceMonitor, checkGeofence } from '../services/geofence.js';
import {
  AIRPORTS,
  DEFAULT_AIRPORT_ID,
  resolveAirportKey,
} from '../services/mockData.js';
import {
  listenDriverTrips,
  listenQueue,
  listenMyQueueStatus,
  listenNotifications,
  markNotificationRead as supabaseMarkNotifRead,
  updateDriverLocation,
  setDriverOnlineStatus,
} from '../services/supabaseService.js';
import { playCalled, playNotification, playPanic, playSuccess, unlockAudio } from '../services/soundService.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { driver, updateDriver } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [inGeofence, setInGeofence] = useState(false);
  const [geofenceDistance, setGeofenceDistance] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [myQueueEntry, setMyQueueEntry] = useState(null);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [panicActive, setPanicActive] = useState(false);
  const [panicCooldown, setPanicCooldown] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [calledAlert, setCalledAlert] = useState(false);

  const geofenceMonitorRef = useRef(null);
  const stopTrackingRef = useRef(null);
  const panicTimeoutRef = useRef(null);
  const prevQueueStatusRef = useRef(null);
  const lastSupabaseWriteRef = useRef(0);

  const airportKey = resolveAirportKey(driver?.airportId);
  const airport = AIRPORTS[airportKey];

  // ─── Merge notifications (local system events + DB) ────────────────────────
  const notifications = [...localNotifications, ...dbNotifications];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Derive myQueueEntry + CALLED detection from queueData ─────────────────
  useEffect(() => {
    if (!driver) return;
    const entry = queueData.find((q) => q.driverId === driver.id) || null;
    setMyQueueEntry(entry);
    if (entry?.status === 'CALLED' && prevQueueStatusRef.current !== 'CALLED') {
      setCalledAlert(true);
      addSystemNotificationRef.current?.(
        'Anda Dipanggil!',
        'Segera menuju zona penjemputan penumpang.',
        'CALLED'
      );
    }
    prevQueueStatusRef.current = entry?.status || null;
  }, [queueData, driver?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Store addSystemNotification in ref so the queueData effect can call it
  const addSystemNotificationRef = useRef(null);

  // ─── Init data & real-time listeners ───────────────────────────────────────
  useEffect(() => {
    if (!driver) return;

    const resolvedKey = resolveAirportKey(driver.airportId);

    // Reset
    setQueueData([]);
    setMyQueueEntry(null);
    setLocalNotifications([]);
    setDbNotifications([]);
    setHistory([]);
    setOnlineDrivers([]);

    geofenceMonitorRef.current = new GeofenceMonitor(
      resolvedKey,
      handleGeofenceEnter,
      handleGeofenceExit
    );
    setIsOnline(driver.online || false);
    if (driver.lat && driver.lng) {
      const loc = { lat: driver.lat, lng: driver.lng, speed: driver.speed || 0 };
      setLocation(loc);
      checkAndUpdateGeofence(loc.lat, loc.lng);
    }
    startTracking();

    // Real trips
    const unsubTrips = listenDriverTrips(driver.id, setHistory);

    // Full queue list (transforms Supabase rows into UI shape)
    const unsubQueueList = driver.airportId
      ? listenQueue(driver.airportId, (rows) => {
          setQueueData(
            rows.map((r, i) => ({
              id: r.id || r.driver_id,
              driverId: r.driver_id,
              name: r.driver_name,
              vehiclePlate: r.plate_number || '',
              queueNumber: i + 1,
              status: r.status,
              joinedAt: r.joined_at,
              zone: r.zone || '',
            }))
          );
        })
      : () => {};

    // DB notifications
    const unsubNotif = listenNotifications(driver.id, (rows) => {
      setDbNotifications(rows);
    });

    return () => {
      unsubTrips();
      unsubQueueList();
      unsubNotif();
    };
  }, [driver?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Network status ────────────────────────────────────────────────────────
  useEffect(() => {
    const on  = () => setNetworkStatus(true);
    const off = () => setNetworkStatus(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const checkAndUpdateGeofence = useCallback((lat, lng) => {
    if (!geofenceMonitorRef.current) return;
    const result = geofenceMonitorRef.current.update(lat, lng);
    setInGeofence(result.inside);
    setGeofenceDistance(result.distance);
  }, []);

  const handleGeofenceEnter = useCallback((result) => {
    setInGeofence(true);
    addSystemNotificationRef.current?.(
      'Geofence Aktif',
      `Anda memasuki area ${result.airport?.name}. Nomor antrian akan diberikan otomatis.`,
      'GEOFENCE'
    );
  }, []);

  const handleGeofenceExit = useCallback((result) => {
    setInGeofence(false);
    addSystemNotificationRef.current?.(
      'Keluar Geofence',
      `Anda telah meninggalkan area ${result.airport?.name}.`,
      'GEOFENCE'
    );
  }, []);

  const addSystemNotification = useCallback((title, message, type = 'SYSTEM') => {
    if (type === 'CALLED')        playCalled();
    else if (type === 'PANIC')    playPanic();
    else if (type === 'GEOFENCE') playSuccess();
    else                          playNotification();

    if (Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/icon-192.svg', badge: '/icon-192.svg' });
    }

    const newNotif = {
      id: `notif-local-${Date.now()}`,
      title,
      message,
      type,
      targetRole: 'driver',
      read: false,
      createdAt: new Date().toISOString(),
      icon: type === 'GEOFENCE' ? 'map-pin' : 'bell',
    };
    setLocalNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Keep ref in sync
  useEffect(() => {
    addSystemNotificationRef.current = addSystemNotification;
  }, [addSystemNotification]);

  const toggleOnlineStatus = useCallback(async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    updateDriver?.({ online: newStatus });
    if (driver?.id) setDriverOnlineStatus(driver.id, newStatus);
    addSystemNotification(
      newStatus ? 'Status Online' : 'Status Offline',
      newStatus
        ? 'Anda sekarang online dan siap menerima penumpang.'
        : 'Anda sekarang offline. Lokasi tetap dipantau.',
      'STATUS'
    );
  }, [isOnline, updateDriver, driver?.id, addSystemNotification]);

  const startTracking = useCallback(() => {
    if (stopTrackingRef.current) stopTrackingRef.current();

    const handleLocationUpdate = (loc) => {
      setLocation(loc);
      setLocationError(null);
      updateDriver?.({ lat: loc.lat, lng: loc.lng, speed: loc.speed || 0, lastUpdate: new Date().toISOString() });
      checkAndUpdateGeofence(loc.lat, loc.lng);
      const now = Date.now();
      if (driver?.id && now - lastSupabaseWriteRef.current >= 15000) {
        lastSupabaseWriteRef.current = now;
        updateDriverLocation(driver.id, driver.airportId, loc.lat, loc.lng, isOnline, loc.speed || 0);
      }
    };

    const handleLocationError = (err) => {
      setLocationError(err.message);
      console.warn('[AppContext] GPS error:', err.message);
    };

    if (isGeolocationAvailable()) {
      stopTrackingRef.current = startLocationTracking(handleLocationUpdate, handleLocationError);
    } else {
      setLocationError('Perangkat tidak mendukung GPS');
    }
  }, [checkAndUpdateGeofence, updateDriver]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopTracking = useCallback(() => {
    if (stopTrackingRef.current) { stopTrackingRef.current(); stopTrackingRef.current = null; }
    stopLocationTracking();
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
      if (panicTimeoutRef.current) clearTimeout(panicTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markNotificationRead = useCallback((notifId) => {
    setLocalNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    setDbNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    if (!String(notifId).startsWith('notif-local-') && driver?.id) {
      supabaseMarkNotifRead(driver.id, notifId).catch(() => {});
    }
  }, [driver?.id]);

  const markAllNotificationsRead = useCallback(() => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setDbNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const triggerPanic = useCallback(async () => {
    if (panicCooldown) return;
    setPanicActive(true);
    setPanicCooldown(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    addSystemNotification(
      'DARURAT - Panic Alert Terkirim',
      `Sinyal darurat Anda telah diterima oleh operator. Bantuan sedang dalam perjalanan. Lokasi: ${
        location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Tidak diketahui'
      }`,
      'PANIC'
    );
    panicTimeoutRef.current = setTimeout(() => setPanicActive(false), 5000);
    setTimeout(() => setPanicCooldown(false), 60000);
  }, [panicCooldown, location, addSystemNotification]);

  const updateLocation = useCallback((lat, lng) => {
    const loc = { lat, lng, speed: 0, timestamp: Date.now() };
    setLocation(loc);
    checkAndUpdateGeofence(lat, lng);
    updateDriver?.({ lat, lng, lastUpdate: new Date().toISOString() });
  }, [checkAndUpdateGeofence, updateDriver]);

  const value = {
    location, locationError, updateLocation, startTracking, stopTracking,
    isOnline, toggleOnlineStatus, networkStatus,
    inGeofence, geofenceDistance, airport,
    queueData, myQueueEntry,
    notifications, unreadCount, markNotificationRead, markAllNotificationsRead, addSystemNotification,
    history,
    onlineDrivers,
    panicActive, panicCooldown, triggerPanic,
    calledAlert,
    dismissCalledAlert: () => setCalledAlert(false),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp harus digunakan di dalam AppProvider');
  return context;
}

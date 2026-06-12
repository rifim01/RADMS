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
  startSimulatedTracking,
  isGeolocationAvailable,
} from '../services/geolocation.js';
import { GeofenceMonitor, checkGeofence } from '../services/geofence.js';
import {
  generateNotifications,
  AIRPORTS,
  DEFAULT_AIRPORT_ID,
} from '../services/mockData.js';
import {
  listenDriverTrips, ensureAuth, updateDriverLocation, setDriverOnlineStatus,
  joinQueue, leaveQueue, listenQueue, markQueuePickup, completeQueueEntry, recordTripCompletion,
} from '../services/firebaseService.js';
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
  const [queueLoading, setQueueLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [panicActive, setPanicActive] = useState(false);
  const [panicCooldown, setPanicCooldown] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  const geofenceMonitorRef = useRef(null);
  const stopTrackingRef = useRef(null);
  const panicTimeoutRef = useRef(null);
  const queueRefreshRef = useRef(null);

  // Use driver's real airport, fallback to mock
  const airport = driver?.airportId
    ? (AIRPORTS[driver.airportId] || AIRPORTS[DEFAULT_AIRPORT_ID])
    : AIRPORTS[DEFAULT_AIRPORT_ID];

  // Init data
  useEffect(() => {
    if (driver) {
      const notifs = generateNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);

      // History starts empty; Firebase fills it
      setHistory([]);

      // Init geofence monitor using driver's real airport
      const airportId = driver.airportId || DEFAULT_AIRPORT_ID;
      geofenceMonitorRef.current = new GeofenceMonitor(
        airportId,
        handleGeofenceEnter,
        handleGeofenceExit
      );

      // Set initial online status from driver data
      setIsOnline(driver.online || false);

      // Check if driver already has location
      if (driver.lat && driver.lng) {
        const loc = { lat: driver.lat, lng: driver.lng, speed: driver.speed || 0 };
        setLocation(loc);
        checkAndUpdateGeofence(loc.lat, loc.lng);
      }

      // GPS always-on: start tracking immediately
      startTracking();

      let unsubTrips = () => {};
      let unsubQueue = () => {};

      ensureAuth().then(() => {
        // Listen to real trips — always update (even if empty)
        unsubTrips = listenDriverTrips(driver.id, (trips) => {
          setHistory(trips);
        });

        // Listen to real RTDB queue for driver's branch
        const branchId = driver.airportId;
        if (branchId) {
          unsubQueue = listenQueue(branchId, (entries) => {
            setQueueData(entries);
            const myEntry = entries.find(e => e.driverId === driver.id || e.driverId === driver.nik);
            setMyQueueEntry(myEntry || null);
          });
        }
      }).catch(() => {});

      return () => {
        unsubTrips();
        unsubQueue();
      };
    }
  }, [driver?.id]);

  // Network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkAndUpdateGeofence = useCallback((lat, lng) => {
    if (!geofenceMonitorRef.current) return;
    // Rebuild monitor if airportId changed
    const airportId = driver?.airportId || DEFAULT_AIRPORT_ID;
    if (geofenceMonitorRef.current.airportId !== airportId) {
      geofenceMonitorRef.current = new GeofenceMonitor(airportId, handleGeofenceEnter, handleGeofenceExit);
    }
    const result = geofenceMonitorRef.current.update(lat, lng);
    setInGeofence(result.inside);
    setGeofenceDistance(result.distance);
  }, [driver?.airportId]);

  const handleGeofenceEnter = useCallback((result) => {
    setInGeofence(true);
    // Auto-add to queue jika online
    addSystemNotification(
      'Geofence Aktif',
      `Anda memasuki area ${result.airport?.name}. Nomor antrian akan diberikan otomatis.`,
      'GEOFENCE'
    );
  }, []);

  const handleGeofenceExit = useCallback((result) => {
    setInGeofence(false);
    addSystemNotification(
      'Keluar Geofence',
      `Anda telah meninggalkan area ${result.airport?.name}.`,
      'GEOFENCE'
    );
  }, []);

  const addSystemNotification = useCallback((title, message, type = 'SYSTEM') => {
    // Play sound based on notification type
    if (type === 'CALLED')   playCalled()
    else if (type === 'PANIC') playPanic()
    else if (type === 'GEOFENCE') playSuccess()
    else playNotification()

    // Browser Notification API if permitted
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/icon-192.svg', badge: '/icon-192.svg' })
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      targetRole: 'driver',
      read: false,
      createdAt: new Date().toISOString(),
      icon: type === 'GEOFENCE' ? 'map-pin' : 'bell',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  /**
   * Toggle status online/offline driver
   */
  const toggleOnlineStatus = useCallback(async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    updateDriver?.({ online: newStatus });

    // Update Firebase online status
    if (driver?.id) {
      ensureAuth().then(() => {
        setDriverOnlineStatus(driver.id, newStatus);
      }).catch(() => {});
    }

    if (newStatus) {
      addSystemNotification(
        'Status Online',
        'Anda sekarang online dan siap menerima penumpang.',
        'STATUS'
      );
    } else {
      // GPS tetap aktif saat offline — hanya update status
      addSystemNotification(
        'Status Offline',
        'Anda sekarang offline. Lokasi tetap dipantau.',
        'STATUS'
      );
    }
  }, [isOnline, updateDriver, driver?.id]);

  const startTracking = useCallback(() => {
    if (stopTrackingRef.current) {
      stopTrackingRef.current();
    }

    const handleLocationUpdate = (loc) => {
      setLocation(loc);
      setLocationError(null);
      updateDriver?.({
        lat: loc.lat,
        lng: loc.lng,
        speed: loc.speed || 0,
        lastUpdate: new Date().toISOString(),
      });
      checkAndUpdateGeofence(loc.lat, loc.lng);
      // Update Firebase location regardless of online status
      if (driver?.id) {
        ensureAuth().then(() => {
          updateDriverLocation(driver.id, driver.airportId, loc.lat, loc.lng, isOnline);
        }).catch(() => {});
      }
    };

    const handleLocationError = (err) => {
      setLocationError(err.message);
      // Fallback ke simulasi jika GPS error
      console.warn('[AppContext] GPS error, menggunakan simulasi:', err.message);
      const stopSim = startSimulatedTracking(handleLocationUpdate);
      stopTrackingRef.current = stopSim;
    };

    if (isGeolocationAvailable()) {
      const stopFn = startLocationTracking(handleLocationUpdate, handleLocationError, 15000);
      stopTrackingRef.current = stopFn;
    } else {
      // Gunakan simulasi jika geolocation tidak tersedia
      const stopSim = startSimulatedTracking(handleLocationUpdate);
      stopTrackingRef.current = stopSim;
    }
  }, [checkAndUpdateGeofence, updateDriver]);

  const stopTracking = useCallback(() => {
    if (stopTrackingRef.current) {
      stopTrackingRef.current();
      stopTrackingRef.current = null;
    }
    stopLocationTracking();
  }, []);

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      stopTracking();
      if (panicTimeoutRef.current) clearTimeout(panicTimeoutRef.current);
    };
  }, []);

  /**
   * Tandai notifikasi sebagai dibaca
   */
  const markNotificationRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  /**
   * Kirim Panic Button alert
   */
  const triggerPanic = useCallback(async () => {
    if (panicCooldown) return;

    setPanicActive(true);
    setPanicCooldown(true);

    // Simulasi kirim alert darurat
    await new Promise((resolve) => setTimeout(resolve, 1500));

    addSystemNotification(
      'DARURAT - Panic Alert Terkirim',
      `Sinyal darurat Anda telah diterima oleh operator. Bantuan sedang dalam perjalanan. Lokasi: ${
        location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Tidak diketahui'
      }`,
      'PANIC'
    );

    // Reset panic state setelah 5 detik
    panicTimeoutRef.current = setTimeout(() => {
      setPanicActive(false);
    }, 5000);

    // Cooldown 60 detik
    setTimeout(() => {
      setPanicCooldown(false);
    }, 60000);
  }, [panicCooldown, location, addSystemNotification]);

  const enterQueue = useCallback(async () => {
    if (!driver?.id || !driver?.airportId) return;
    // Block if >2000m from airport
    if (geofenceDistance != null && geofenceDistance > 2000) {
      addSystemNotification(
        'Di Luar Area Bandara',
        `Anda ${Math.round(geofenceDistance)}m dari bandara. Harus dalam radius 2 km untuk masuk antrian.`,
        'GEOFENCE'
      );
      return;
    }
    setQueueLoading(true);
    try {
      await ensureAuth();
      await joinQueue(driver.id, driver.name, driver.plateNumber || '', driver.airportId);
    } catch {
      addSystemNotification('Antrian', 'Gagal masuk antrian. Coba lagi.', 'SYSTEM');
    } finally {
      setQueueLoading(false);
    }
  }, [driver?.id, driver?.name, driver?.plateNumber, driver?.airportId, geofenceDistance]);

  const exitQueue = useCallback(async () => {
    if (!driver?.id || !driver?.airportId) return;
    setQueueLoading(true);
    try {
      await ensureAuth();
      await leaveQueue(driver.id, driver.airportId);
    } catch {
      addSystemNotification('Antrian', 'Gagal keluar antrian. Coba lagi.', 'SYSTEM');
    } finally {
      setQueueLoading(false);
    }
  }, [driver?.id, driver?.airportId]);

  // Confirm pickup by staff — sets status PICKUP
  const pickupQueue = useCallback(async () => {
    if (!driver?.id || !driver?.airportId) return;
    try {
      await ensureAuth();
      await markQueuePickup(driver.id, driver.airportId);
    } catch {}
  }, [driver?.id, driver?.airportId]);

  // Driver completes the trip — removes from queue, records trip
  const completeTrip = useCallback(async () => {
    if (!driver?.id || !driver?.airportId) return;
    setQueueLoading(true);
    try {
      await ensureAuth();
      await completeQueueEntry(driver.id, driver.airportId);
      await recordTripCompletion(driver.id, driver.name, driver.airportId, driver.plateNumber || '');
      addSystemNotification('Perjalanan Selesai', 'Perjalanan berhasil diselesaikan. Anda dapat masuk antrian kembali.', 'COMPLETED');
    } catch {
      addSystemNotification('Error', 'Gagal menyelesaikan perjalanan. Coba lagi.', 'SYSTEM');
    } finally {
      setQueueLoading(false);
    }
  }, [driver?.id, driver?.name, driver?.airportId, driver?.plateNumber]);

  /**
   * Update posisi manual (untuk testing)
   */
  const updateLocation = useCallback(
    (lat, lng) => {
      const loc = { lat, lng, speed: 0, timestamp: Date.now() };
      setLocation(loc);
      checkAndUpdateGeofence(lat, lng);
      updateDriver?.({ lat, lng, lastUpdate: new Date().toISOString() });
    },
    [checkAndUpdateGeofence, updateDriver]
  );

  const value = {
    // Location
    location,
    locationError,
    updateLocation,
    startTracking,
    stopTracking,

    // Status
    isOnline,
    toggleOnlineStatus,
    networkStatus,

    // Geofence
    inGeofence,
    geofenceDistance,
    airport,

    // Queue
    queueData,
    myQueueEntry,
    queueLoading,
    enterQueue,
    exitQueue,
    pickupQueue,
    completeTrip,

    // Notifications
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    addSystemNotification,

    // History
    history,

    // Map
    onlineDrivers,

    // Panic
    panicActive,
    panicCooldown,
    triggerPanic,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp harus digunakan di dalam AppProvider');
  }
  return context;
}

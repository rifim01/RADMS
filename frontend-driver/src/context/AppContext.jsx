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
  generateQueueData,
  generateNotifications,
  generateHistory,
  generateOnlineDrivers,
  AIRPORTS,
  DEFAULT_AIRPORT_ID,
} from '../services/mockData.js';
import { listenDriverTrips, listenMyQueueStatus, ensureAuth, updateDriverLocation, setDriverOnlineStatus } from '../services/firebaseService.js';
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [panicActive, setPanicActive] = useState(false);
  const [panicCooldown, setPanicCooldown] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [calledAlert, setCalledAlert] = useState(false); // full-screen CALLED overlay

  const geofenceMonitorRef = useRef(null);
  const stopTrackingRef = useRef(null);
  const panicTimeoutRef = useRef(null);
  const queueRefreshRef = useRef(null);
  const prevQueueStatusRef = useRef(null);

  const airport = AIRPORTS[DEFAULT_AIRPORT_ID];

  // Init data
  useEffect(() => {
    if (driver) {
      const queue = generateQueueData(DEFAULT_AIRPORT_ID, driver.id);
      setQueueData(queue);
      const myEntry = queue.find((q) => q.driverId === driver.id);
      setMyQueueEntry(myEntry || null);

      const notifs = generateNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);

      const hist = generateHistory(driver.id);
      setHistory(hist);

      setOnlineDrivers(generateOnlineDrivers());

      // Init geofence monitor
      geofenceMonitorRef.current = new GeofenceMonitor(
        DEFAULT_AIRPORT_ID,
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

      // GPS always-on: start tracking immediately regardless of online status
      startTracking();

      // Listen to real trips and queue status from Firebase
      let unsubTrips = () => {};
      let unsubQueue = () => {};
      ensureAuth().then(() => {
        unsubTrips = listenDriverTrips(driver.id, (trips) => {
          if (trips.length > 0) setHistory(trips);
        });

        // Real-time queue status listener — shows CALLED alert to driver
        if (driver.airportId) {
          unsubQueue = listenMyQueueStatus(driver.id, driver.airportId, (entry) => {
            if (!entry) {
              setMyQueueEntry(null);
              prevQueueStatusRef.current = null;
              return;
            }
            setMyQueueEntry(entry);
            // Trigger CALLED alert when status transitions to CALLED
            if (entry.status === 'CALLED' && prevQueueStatusRef.current !== 'CALLED') {
              setCalledAlert(true);
              addSystemNotification(
                'Anda Dipanggil!',
                'Segera menuju zona penjemputan penumpang.',
                'CALLED'
              );
            }
            prevQueueStatusRef.current = entry.status;
          });
        }
      }).catch(() => {});

      return () => {
        unsubTrips();
        unsubQueue();
      };
    }
  }, [driver?.id]);

  // Refresh queue simulasi setiap 30 detik
  useEffect(() => {
    if (!driver || !isOnline) return;

    queueRefreshRef.current = setInterval(() => {
      setQueueData((prev) => {
        const updated = prev.map((entry) => {
          if (entry.driverId === driver.id) return entry;
          return entry;
        });
        return updated;
      });
    }, 30000);

    return () => {
      if (queueRefreshRef.current) clearInterval(queueRefreshRef.current);
    };
  }, [driver?.id, isOnline]);

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
    const result = geofenceMonitorRef.current.update(lat, lng);
    setInGeofence(result.inside);
    setGeofenceDistance(result.distance);
  }, []);

  const handleGeofenceEnter = useCallback((result) => {
    setInGeofence(true);
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
      console.warn('[AppContext] GPS error:', err.message);
      // Do NOT fall back to simulation — show error state instead
    };

    if (isGeolocationAvailable()) {
      const stopFn = startLocationTracking(handleLocationUpdate, handleLocationError);
      stopTrackingRef.current = stopFn;
    } else {
      setLocationError('Perangkat tidak mendukung GPS');
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

    // CALLED overlay
    calledAlert,
    dismissCalledAlert: () => setCalledAlert(false),
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

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
  generateQueueData,
  generateNotifications,
  generateHistory,
  generateOnlineDrivers,
  AIRPORTS,
  DEFAULT_AIRPORT_ID,
} from '../services/mockData.js';

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

  const geofenceMonitorRef = useRef(null);
  const stopTrackingRef = useRef(null);
  const panicTimeoutRef = useRef(null);
  const queueRefreshRef = useRef(null);

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
    }
  }, [driver?.id]);

  // Refresh queue simulasi setiap 30 detik
  useEffect(() => {
    if (!driver || !isOnline) return;

    queueRefreshRef.current = setInterval(() => {
      // Simulasi pergerakan antrian
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

    if (newStatus) {
      // Mulai location tracking saat online
      startTracking();
      addSystemNotification(
        'Status Online',
        'Anda sekarang online dan siap menerima penumpang.',
        'STATUS'
      );
    } else {
      // Stop tracking saat offline
      stopTracking();
      addSystemNotification(
        'Status Offline',
        'Anda sekarang offline.',
        'STATUS'
      );
    }
  }, [isOnline, updateDriver]);

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

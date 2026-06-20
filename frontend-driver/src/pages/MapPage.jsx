import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Crosshair, Layers, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../supabase/config.js';
import Header from '../components/Header.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDistance } from '../utils/haversine.js';

// Dynamically import Leaflet to avoid SSR issues
let L;
let MapContainer, TileLayer, Marker, Circle, Popup, useMap;

export default function MapPage() {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [showDrivers, setShowDrivers] = useState(true);
  const [centeringOnUser, setCenteringOnUser] = useState(false);

  const { driver } = useAuth();
  const {
    location,
    isOnline,
    inGeofence,
    geofenceDistance,
    airport,
    startTracking,
    locationError,
  } = useApp();
  const [onlineDrivers, setOnlineDrivers] = useState([]);

  // Listen to Supabase for nearby drivers in same branch
  useEffect(() => {
    if (!driver?.airportId) return;

    const fetchDrivers = () => {
      supabase
        .from('radms_driver_locations')
        .select('*')
        .eq('branch_id', driver.airportId)
        .eq('is_online', true)
        .neq('driver_id', driver.id)
        .then(({ data }) => setOnlineDrivers(data || []));
    };

    fetchDrivers();

    const channel = supabase
      .channel('driver_locations_map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radms_driver_locations' }, fetchDrivers)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [driver?.airportId, driver?.id]);

  const airportCenter = airport
    ? [airport.lat, airport.lng]
    : [-5.0614, 119.5542];

  useEffect(() => {
    // Dynamically import Leaflet
    import('leaflet').then((leafletModule) => {
      L = leafletModule.default;

      // Fix default marker icon paths for Vite
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapRef.current || leafletMapRef.current) return;

      try {
        const userLat = location?.lat ?? airportCenter[0];
        const userLng = location?.lng ?? airportCenter[1];

        const map = L.map(mapRef.current, {
          center: [userLat, userLng],
          zoom: 15,
          zoomControl: true,
          attributionControl: true,
        });

        // OpenStreetMap tiles (free, no API key)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Airport marker
        const airportIcon = L.divIcon({
          className: '',
          html: `<div style="
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #2563eb, #4338ca);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(37,99,235,0.5);
            display: flex; align-items: center; justify-content: center;
          "><span style="transform: rotate(45deg); font-size: 16px;">â</span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        L.marker(airportCenter, { icon: airportIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: Inter, sans-serif; padding: 4px;">
              <strong style="color: #1e293b;">${airport?.name || 'Bandara'}</strong><br/>
              <span style="color: #64748b; font-size: 12px;">${airport?.city || ''}, ${airport?.iata || ''}</span>
            </div>
          `);

        // Geofence circle (500m)
        L.circle(airportCenter, {
          radius: airport?.geofenceRadius || 500,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '8, 6',
        }).addTo(map)
          .bindPopup(`<div style="font-family: Inter, sans-serif;"><strong>Zona Geofence</strong><br/><span style="color:#64748b;font-size:12px;">Radius ${airport?.geofenceRadius || 500}m</span></div>`);

        leafletMapRef.current = map;
        setMapReady(true);
      } catch (err) {
        console.error('Map init error:', err);
        setMapError('Gagal memuat peta. Coba muat ulang halaman.');
      }
    }).catch((err) => {
      console.error('Leaflet import error:', err);
      setMapError('Gagal memuat library peta.');
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update user marker when location changes
  useEffect(() => {
    if (!mapReady || !L || !leafletMapRef.current || !location) return;

    const map = leafletMapRef.current;

    const userIcon = L.divIcon({
      className: '',
      html: `<div style="
        position: relative;
        width: 20px; height: 20px;
      ">
        <div style="
          width: 20px; height: 20px;
          background: #22c55e;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(34,197,94,0.6);
        "></div>
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 32px; height: 32px;
          background: rgba(34,197,94,0.2);
          border-radius: 50%;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (markersRef.current.userMarker) {
      markersRef.current.userMarker.setLatLng([location.lat, location.lng]);
    } else {
      const marker = L.marker([location.lat, location.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <strong>${driver?.name || 'Anda'}</strong><br/>
            <span style="color:#64748b;font-size:12px;">${driver?.vehiclePlate || ''}</span><br/>
            <span style="color:${isOnline ? '#22c55e' : '#94a3b8'};font-size:12px;font-weight:600;">
              ${isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        `);
      markersRef.current.userMarker = marker;
    }

    if (location.accuracy) {
      if (markersRef.current.accuracyCircle) {
        markersRef.current.accuracyCircle.setLatLng([location.lat, location.lng]);
        markersRef.current.accuracyCircle.setRadius(location.accuracy);
      } else {
        const circle = L.circle([location.lat, location.lng], {
          radius: location.accuracy,
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
        markersRef.current.accuracyCircle = circle;
      }
    }
  }, [location, mapReady, driver, isOnline]);

  // Update other drivers markers
  useEffect(() => {
    if (!mapReady || !L || !leafletMapRef.current || !showDrivers) return;

    const map = leafletMapRef.current;

    Object.keys(markersRef.current).forEach((key) => {
      if (key.startsWith('otherDriver-')) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });

    if (!showDrivers) return;

    onlineDrivers.forEach((d) => {
      const statusColor = d.status === 'CALLED' ? '#3b82f6' : '#f59e0b';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 28px; height: 28px;
          background: ${statusColor};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
        ">${d.queue_number || '?'}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([d.lat, d.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <strong style="color:#1e293b;">${d.driver_id}</strong><br/>
            <span style="color:${statusColor};font-size:12px;font-weight:600;">${d.is_online ? 'Online' : 'Offline'}</span>
          </div>
        `);
      markersRef.current[`otherDriver-${d.driver_id}`] = marker;
    });
  }, [onlineDrivers, mapReady, showDrivers]);

  const centerOnUser = () => {
    if (!leafletMapRef.current || !location) return;
    setCenteringOnUser(true);
    leafletMapRef.current.setView([location.lat, location.lng], 16, { animate: true });
    setTimeout(() => setCenteringOnUser(false), 600);
  };

  const centerOnAirport = () => {
    if (!leafletMapRef.current) return;
    leafletMapRef.current.setView(airportCenter, 15, { animate: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20 flex flex-col">
      <Header title="Peta Lokasi" />

      <div className="relative flex-1" style={{ minHeight: '60vh' }}>
        <div
          ref={mapRef}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        />

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center px-6">
              <p className="text-red-400 font-medium mb-2">{mapError}</p>
              <button onClick={() => window.location.reload()} className="text-blue-400 text-sm underline">Muat Ulang</button>
            </div>
          </div>
        )}

        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Memuat peta...</p>
            </div>
          </div>
        )}

        {mapReady && (
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <button onClick={centerOnUser} disabled={!location} className="w-10 h-10 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-40">
              {centeringOnUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            </button>
            <button onClick={centerOnAirport} className="w-10 h-10 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
              <Navigation className="w-4 h-4" />
            </button>
            <button onClick={() => setShowDrivers((v) => !v)} className={`w-10 h-10 backdrop-blur border rounded-xl flex items-center justify-center transition-colors shadow-lg ${
              showDrivers ? 'bg-blue-600/90 border-blue-500 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-400'
            }`}>
              <Users className="w-4 h-4" />
            </button>
          </div>
        )}

        {mapReady && (
          <div className="absolute top-3 left-3 z-10">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur border text-xs font-semibold shadow-lg ${
              inGeofence ? 'bg-blue-600/90 border-blue-500 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${inGeofence ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              {inGeofence ? 'Dalam Geofence' : 'Luar Geofence'}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/95 backdrop-blur border-t border-slate-700/50 px-4 py-4 z-20">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-slate-500 text-xs">Status</p>
            <p className={`font-semibold text-sm mt-0.5 ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs">Jarak Bandara</p>
            <p className="text-white font-semibold text-sm mt-0.5">
              {geofenceDistance != null ? formatDistance(geofenceDistance) : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs">Driver Online</p>
            <p className="text-white font-semibold text-sm mt-0.5">{onlineDrivers.length}</p>
          </div>
        </div>

        {locationError && (
          <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            <p className="text-yellow-400 text-xs">GPS: {locationError}</p>
            <button onClick={startTracking} className="text-blue-400 text-xs underline mt-1">Coba lagi</button>
          </div>
        )}

        {location && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-slate-600 text-xs font-mono">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

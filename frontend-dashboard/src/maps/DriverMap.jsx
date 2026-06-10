import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createDriverIcon(status) {
  const color = status === 'online' ? '#10b981' : '#94a3b8'
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="32" height="40">
      <circle cx="20" cy="18" r="16" fill="${color}" stroke="white" stroke-width="3"/>
      <path d="M14 16h12l-2 6H16z" fill="white"/>
      <path d="M12 16l1-4h14l1 4" stroke="white" stroke-width="1.5" fill="none"/>
      <circle cx="15" cy="22" r="2" fill="white"/>
      <circle cx="25" cy="22" r="2" fill="white"/>
      <path d="M20 34 L14 22 L26 22 Z" fill="${color}"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  })
}

export default function DriverMap({ drivers, center, zoom = 13, height = 450 }) {
  const defaultCenter = center || [drivers[0]?.lastLat || -5.0617, drivers[0]?.lastLng || 119.5543]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {drivers.map(driver => (
        <Marker
          key={driver.id}
          position={[driver.lastLat, driver.lastLng]}
          icon={createDriverIcon(driver.status)}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-gray-800">{driver.name}</p>
              <p className="text-gray-500">{driver.vehicle} - {driver.plateNumber}</p>
              <p className={`mt-1 font-medium ${driver.status === 'online' ? 'text-emerald-600' : 'text-gray-400'}`}>
                {driver.status === 'online' ? '● Online' : '● Offline'}
              </p>
              {driver.status === 'online' && (
                <p className="text-gray-500">Kecepatan: {driver.speed} km/j</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createAirportIcon(tz) {
  const color = tz === 'WITA' ? '#f59e0b' : '#3b82f6'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="36" height="44">
      <circle cx="20" cy="18" r="17" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="20" y="24" text-anchor="middle" fill="white" font-size="16" font-family="Arial">✈</text>
      <path d="M20 35 L13 24 L27 24 Z" fill="${color}"/>
    </svg>
  `
  return L.divIcon({ html: svg, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44] })
}

export default function NationalMap({ airports, height = 400 }) {
  const validAirports = airports.filter(a => a.lat !== 0 && a.lng !== 0)
  const center = [-0.5, 113.0]

  return (
    <MapContainer center={center} zoom={5} style={{ height, width: '100%', borderRadius: '0.75rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validAirports.map(airport => (
        <>
          <Circle
            key={`circle-${airport.id}`}
            center={[airport.lat, airport.lng]}
            radius={airport.radius || 5000}
            pathOptions={{ color: airport.tz === 'WITA' ? '#f59e0b' : '#3b82f6', fillColor: airport.tz === 'WITA' ? '#f59e0b' : '#3b82f6', fillOpacity: 0.1 }}
          />
          <Marker
            key={`marker-${airport.id}`}
            position={[airport.lat, airport.lng]}
            icon={createAirportIcon(airport.tz)}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <p className="font-bold text-gray-800">{airport.id}</p>
                <p className="text-blue-600 font-medium mt-1">✈ {airport.code} — {airport.city}</p>
                <p className="text-xs text-gray-400 mb-2">{airport.tz} {airport.tz === 'WITA' ? '(+8)' : '(+7)'}</p>
                <div className="space-y-1 text-gray-600">
                  <p>Driver Online: <span className="font-semibold text-emerald-600">{airport.driversOnline}</span></p>
                  <p>Antrian Aktif: <span className="font-semibold text-yellow-600">{airport.queueCount}</span></p>
                  <p>Staf Aktif: <span className="font-semibold text-blue-600">{airport.staffActive}</span></p>
                  <p>Penjemputan Hari Ini: <span className="font-semibold">{airport.totalPickupsToday}</span></p>
                </div>
              </div>
            </Popup>
          </Marker>
        </>
      ))}
    </MapContainer>
  )
}

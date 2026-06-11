import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import RifimLogo from '../components/RifimLogo.jsx';

// Airport runway background SVG (CSS-drawn, no image file needed)
function AirportBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a0f"/>
          <stop offset="60%" stopColor="#1a0505"/>
          <stop offset="100%" stopColor="#3d0000"/>
        </linearGradient>
        <linearGradient id="runway" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111"/>
          <stop offset="100%" stopColor="#2a0000"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#CC0000" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#CC0000" stopOpacity="0"/>
        </radialGradient>
        <filter id="blur2">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="400" height="260" fill="url(#sky)"/>

      {/* Red glow from runway */}
      <ellipse cx="200" cy="280" rx="300" ry="120" fill="url(#glow)"/>

      {/* Runway surface */}
      <polygon points="120,260 280,260 220,130 180,130" fill="url(#runway)"/>

      {/* Runway centerline lights */}
      {[140,148,156,164,172,180,188,196,204,212].map((y, i) => (
        <rect key={i} x="199" y={y} width="2" height="5" rx="1" fill="#CC0000" opacity={0.3 + i*0.06}/>
      ))}

      {/* Runway edge lights left */}
      {[0,1,2,3,4,5,6].map(i => {
        const y = 135 + i * 18
        const x = 183 - i * 5
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#ff4400" opacity={0.4 + i*0.08} filter="url(#blur2)"/>
      })}
      {/* Runway edge lights right */}
      {[0,1,2,3,4,5,6].map(i => {
        const y = 135 + i * 18
        const x = 217 + i * 5
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#ff4400" opacity={0.4 + i*0.08} filter="url(#blur2)"/>
      })}

      {/* Distant city lights */}
      {[30,60,90,320,350,370,310,280].map((x, i) => (
        <rect key={i} x={x} y={120 + (i%3)*4} width="1" height={6 + (i%4)*4} fill="#ff6633" opacity="0.15"/>
      ))}

      {/* Control tower silhouette */}
      <rect x="50" y="90" width="8" height="50" fill="#111" opacity="0.8"/>
      <rect x="44" y="86" width="20" height="10" fill="#111" opacity="0.8"/>
      <rect x="47" y="80" width="3" height="10" fill="#111" opacity="0.8"/>

      {/* Airplane silhouette */}
      <g transform="translate(300,70) rotate(-15)" opacity="0.3">
        <ellipse cx="0" cy="0" rx="18" ry="4" fill="#ccc"/>
        <polygon points="-5,-4 -5,4 10,0" fill="#bbb"/>
        <line x1="-8" y1="0" x2="-20" y2="-12" stroke="#bbb" strokeWidth="2"/>
        <line x1="-8" y1="0" x2="-20" y2="12" stroke="#bbb" strokeWidth="2"/>
      </g>

      {/* Red speed lines */}
      <line x1="0" y1="200" x2="400" y2="160" stroke="#CC0000" strokeWidth="0.5" opacity="0.15"/>
      <line x1="0" y1="220" x2="400" y2="180" stroke="#CC0000" strokeWidth="0.5" opacity="0.1"/>

      {/* Vignette overlay */}
      <rect width="400" height="260" fill="black" opacity="0.2"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nik, setNik]         = useState('');
  const [nama, setNama]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(nik, nama);
      if (result.success) {
        navigate('/home', { replace: true });
      } else {
        setError(result.error || 'Login gagal. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Airport background hero */}
      <div className="relative flex-shrink-0 h-64 overflow-hidden">
        <AirportBg />

        {/* Logo + title */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <RifimLogo className="h-14 w-auto mb-3" variant="dark" />
          <p className="text-red-300 text-xs tracking-widest uppercase font-medium mt-1">
            Driver Management System
          </p>
        </div>
      </div>

      {/* Login card */}
      <div className="flex-1 flex flex-col bg-white rounded-t-3xl -mt-4 px-6 pt-8 pb-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-gray-900 text-2xl font-bold">Masuk</h2>
          <p className="text-gray-400 text-sm mt-1">Masuk ke akun driver Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-500 text-xs font-medium mb-2 ml-1">ID Driver (NIK)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div className="w-px h-5 bg-gray-200" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={nik}
                onChange={e => setNik(e.target.value.replace(/\D/g,'').slice(0,20))}
                placeholder="Masukkan NIK / ID Driver"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-gray-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-400 transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-medium mb-2 ml-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <div className="w-px h-5 bg-gray-200" />
              </div>
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Nama sesuai data RIFIM"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-gray-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-400 transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-4 mt-4 transition-all text-base shadow-lg shadow-red-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #EE1111 0%, #880000 100%)' }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-red-700 text-xs font-semibold mb-2">Cara Login:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• <span className="text-gray-700 font-medium">ID Driver</span> = NIK yang terdaftar di sistem RIFIM</li>
            <li>• <span className="text-gray-700 font-medium">Nama</span> = nama lengkap sesuai data (minimal kata pertama)</li>
            <li>• Hubungi koordinator jika lupa NIK Anda</li>
          </ul>
        </div>

        <p className="text-center text-gray-300 text-xs mt-auto pt-6">
          &copy; 2025 PT. RIFIM INTERNATIONAL GEMILANG
        </p>
      </div>
    </div>
  );
}

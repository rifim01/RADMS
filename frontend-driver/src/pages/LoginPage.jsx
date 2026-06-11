import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import RifimLogo from '../components/RifimLogo.jsx';

// Background dramatik merah (kanan atas) + elemen bandara (kiri bawah)
function HeroBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Dark dramatic sky — kanan atas */}
        <linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#060208"/>
          <stop offset="40%"  stopColor="#1c0205"/>
          <stop offset="100%" stopColor="#4a0000"/>
        </linearGradient>
        {/* Center spotlight — kanan atas */}
        <radialGradient id="hSpot" cx="50%" cy="0%" r="80%">
          <stop offset="0%"   stopColor="#ff2200" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#ff2200" stopOpacity="0"/>
        </radialGradient>
        {/* Ground glow */}
        <radialGradient id="hGnd" cx="50%" cy="100%" r="60%">
          <stop offset="0%"   stopColor="#CC0000" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#CC0000" stopOpacity="0"/>
        </radialGradient>
        {/* Brush stroke texture — kanan atas */}
        <filter id="hBlur"><feGaussianBlur stdDeviation="2.5"/></filter>
        <filter id="hBlur2"><feGaussianBlur stdDeviation="1"/></filter>
      </defs>

      {/* Sky */}
      <rect width="400" height="280" fill="url(#hSky)"/>
      {/* Spotlight from top */}
      <ellipse cx="200" cy="-20" rx="250" ry="160" fill="url(#hSpot)"/>
      {/* Ground glow */}
      <ellipse cx="200" cy="300" rx="280" ry="100" fill="url(#hGnd)"/>

      {/* Brush stroke BG (kanan atas style) */}
      <ellipse cx="200" cy="140" rx="185" ry="115" fill="#1a0000" opacity="0.55" filter="url(#hBlur)"/>

      {/* Runway surface (kiri bawah + tengah bawah) */}
      <polygon points="140,280 260,280 225,155 175,155" fill="#0e0000" opacity="0.8"/>
      {/* Runway centerline */}
      {Array.from({length:11},(_,i)=>(
        <rect key={i} x="199" y={158+i*11} width="2" height="7" rx="1"
          fill="#CC0000" opacity={0.15+i*0.07}/>
      ))}
      {/* Edge lights kiri */}
      {Array.from({length:8},(_,i)=>(
        <circle key={i} cx={178-i*4} cy={160+i*15} r="2.5"
          fill="#ff3300" opacity={0.3+i*0.08} filter="url(#hBlur2)"/>
      ))}
      {/* Edge lights kanan */}
      {Array.from({length:8},(_,i)=>(
        <circle key={i} cx={222+i*4} cy={160+i*15} r="2.5"
          fill="#ff3300" opacity={0.3+i*0.08} filter="url(#hBlur2)"/>
      ))}

      {/* Control tower siluet (kiri bawah) */}
      <rect x="48" y="110" width="9" height="60" fill="#0d0000" opacity="0.85"/>
      <rect x="42" y="106" width="21" height="11" rx="2" fill="#0d0000" opacity="0.85"/>
      <rect x="50" y="96" width="5" height="14" fill="#0d0000" opacity="0.85"/>
      {/* Tower light */}
      <circle cx="52" cy="96" r="2" fill="#ff6600" opacity="0.6" filter="url(#hBlur2)"/>

      {/* Terminal siluet kiri */}
      <rect x="5" y="160" width="100" height="50" rx="3" fill="#0a0000" opacity="0.75"/>
      <rect x="15" y="150" width="80" height="15" rx="2" fill="#0a0000" opacity="0.75"/>
      {/* Terminal windows */}
      {[18,30,42,54,66,78,87].map((x,i)=>(
        <rect key={i} x={x} y={168} width="7" height="10" rx="1"
          fill="#ff4400" opacity="0.1"/>
      ))}

      {/* Terminal siluet kanan */}
      <rect x="295" y="170" width="100" height="40" rx="3" fill="#0a0000" opacity="0.7"/>

      {/* Airplane siluet (kiri bawah / tengah bawah) */}
      <g transform="translate(295,90) rotate(-12)" opacity="0.4">
        <ellipse cx="0" cy="0" rx="30" ry="5.5" fill="#ddd"/>
        <polygon points="-8,-5 -8,5 18,0" fill="#ccc"/>
        <line x1="-12" y1="0" x2="-32" y2="-18" stroke="#ccc" strokeWidth="2.5"/>
        <line x1="-12" y1="0" x2="-32" y2="18"  stroke="#ccc" strokeWidth="2.5"/>
        <line x1="12"  y1="0" x2="25"  y2="-7"  stroke="#ccc" strokeWidth="1.5"/>
      </g>

      {/* Red speed lines (kanan atas) */}
      <line x1="0"   y1="180" x2="400" y2="130" stroke="#CC0000" strokeWidth="0.8" opacity="0.12"/>
      <line x1="0"   y1="220" x2="400" y2="180" stroke="#CC0000" strokeWidth="0.5" opacity="0.08"/>
      <line x1="200" y1="0"   x2="150" y2="280" stroke="#CC0000" strokeWidth="0.4" opacity="0.06"/>

      {/* Red arrow diagonal (kiri bawah / kanan bawah) */}
      <g transform="translate(330,50)" opacity="0.5">
        <line x1="0" y1="40" x2="35" y2="5" stroke="#ff2200" strokeWidth="2.5" strokeLinecap="round"/>
        <polygon points="35,5 27,5 35,13" fill="#ff2200"/>
      </g>

      {/* Vignette */}
      <rect width="400" height="280" fill="black" opacity="0.25"/>
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
      {/* Hero area */}
      <div className="relative flex-shrink-0 h-64 overflow-hidden">
        <HeroBg />
        {/* Bingkai merah (tengah bawah style) */}
        <div className="absolute inset-4 border border-red-700/40 rounded-2xl pointer-events-none"/>
        {/* Logo + tagline */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
          <RifimLogo className="h-16 w-auto" variant="dark"/>
          <div className="flex items-center gap-4 mt-1">
            {['INTEGRITAS','INOVASI','KUALITAS'].map(v => (
              <span key={v} className="text-red-300/80 text-[9px] tracking-widest font-semibold uppercase">{v}</span>
            ))}
          </div>
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
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-500 text-xs font-medium mb-2 ml-1">ID Driver (NIK)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400"/>
                <div className="w-px h-5 bg-gray-200"/>
              </div>
              <input type="text" inputMode="numeric" value={nik}
                onChange={e => setNik(e.target.value.replace(/\D/g,'').slice(0,20))}
                placeholder="Masukkan NIK / ID Driver"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-gray-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-400 transition-colors"
                disabled={loading}/>
            </div>
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-medium mb-2 ml-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400"/>
                <div className="w-px h-5 bg-gray-200"/>
              </div>
              <input type="text" value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Nama sesuai data RIFIM"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-gray-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-400 transition-colors"
                disabled={loading}/>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-4 mt-4 transition-all text-base shadow-lg shadow-red-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#FF1111 0%,#880000 100%)' }}>
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                <span>Memverifikasi...</span></>
            ) : (
              <><LogIn className="w-5 h-5"/><span>Masuk</span></>
            )}
          </button>
        </form>

        <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-red-700 text-xs font-semibold mb-2">Cara Login:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• <span className="text-gray-700 font-medium">ID Driver</span> = NIK terdaftar di sistem RIFIM</li>
            <li>• <span className="text-gray-700 font-medium">Nama</span> = nama sesuai data (minimal kata pertama)</li>
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

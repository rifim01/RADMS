import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_REDIRECTS } from '../services/authService'

// Inline logo — dark variant (white FIM)
function RifimLogoWhite({ className = '' }) {
  return (
    <svg viewBox="0 0 310 92" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="dlBg" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FF1111"/>
          <stop offset="100%" stopColor="#880000"/>
        </linearGradient>
        <filter id="dlSh">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.6)"/>
        </filter>
      </defs>
      <rect x="1" y="1" width="86" height="86" rx="5" fill="none" stroke="#ff3333" strokeWidth="2.5"/>
      <rect x="5" y="5" width="78" height="78" rx="3" fill="url(#dlBg)" filter="url(#dlSh)"/>
      <rect x="5" y="5" width="78" height="11" rx="3" fill="rgba(255,255,255,0.13)"/>
      <text x="44" y="64" textAnchor="middle" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="50" fill="white" filter="url(#dlSh)">RI</text>
      <line x1="91" y1="10" x2="91" y2="78" stroke="white" strokeWidth="2" opacity="0.3"/>
      <text x="100" y="74" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="68" fill="white" filter="url(#dlSh)" letterSpacing="-1">FIM</text>
      <g transform="translate(261,12)">
        <line x1="0" y1="22" x2="22" y2="0" stroke="#ff4444" strokeWidth="3" strokeLinecap="round"/>
        <polygon points="22,0 14,0 22,8" fill="#ff4444"/>
      </g>
      <text x="2" y="90" fontFamily="Arial,Helvetica,sans-serif" fontWeight="600" fontSize="9" fill="rgba(255,255,255,0.6)" letterSpacing="0.6">PT. RIFIM INTERNATIONAL GEMILANG</text>
    </svg>
  )
}

// Airport background — kiri bawah / tengah bawah style
// Clean white/light grey tones with red accents, control tower, plane, runway
function AirportHeroBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ahSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#050208"/>
          <stop offset="35%"  stopColor="#1a0205"/>
          <stop offset="100%" stopColor="#4d0000"/>
        </linearGradient>
        <radialGradient id="ahSpot" cx="50%" cy="5%" r="75%">
          <stop offset="0%"   stopColor="#dd0000" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#dd0000" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="ahGlow" cx="50%" cy="100%" r="50%">
          <stop offset="0%"   stopColor="#CC0000" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#CC0000" stopOpacity="0"/>
        </radialGradient>
        <filter id="ahBlur"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="ahBlur2"><feGaussianBlur stdDeviation="1.5"/></filter>
      </defs>

      <rect width="800" height="600" fill="url(#ahSky)"/>
      <ellipse cx="400" cy="-30" rx="500" ry="300" fill="url(#ahSpot)"/>
      <ellipse cx="400" cy="650" rx="500" ry="180" fill="url(#ahGlow)"/>

      {/* Runway */}
      <polygon points="280,600 520,600 445,300 355,300" fill="#0b0000" opacity="0.85"/>
      {Array.from({length:14},(_,i)=>(
        <rect key={i} x="399" y={305+i*22} width="2" height="12" rx="1"
          fill="#CC0000" opacity={0.15+i*0.055}/>
      ))}
      {Array.from({length:9},(_,i)=>(
        <circle key={i} cx={358-i*9} cy={308+i*34} r="3.5"
          fill="#ff3300" opacity={0.3+i*0.07} filter="url(#ahBlur2)"/>
      ))}
      {Array.from({length:9},(_,i)=>(
        <circle key={i} cx={442+i*9} cy={308+i*34} r="3.5"
          fill="#ff3300" opacity={0.3+i*0.07} filter="url(#ahBlur2)"/>
      ))}

      {/* Terminal left */}
      <rect x="30" y="260" width="200" height="110" rx="4" fill="#0d0000" opacity="0.85"/>
      <rect x="50" y="235" width="160" height="30" rx="3" fill="#0d0000" opacity="0.85"/>
      <rect x="110" y="200" width="22" height="40" fill="#0d0000" opacity="0.85"/>
      {/* Gangways */}
      <rect x="220" y="295" width="60" height="10" rx="2" fill="#110000" opacity="0.7"/>
      <rect x="220" y="325" width="55" height="10" rx="2" fill="#110000" opacity="0.7"/>
      {/* Windows */}
      {[55,75,95,115,135,155,175,195].map((x,i)=>(
        <rect key={i} x={x} y={270} width="11" height="16" rx="1" fill="#ff4400" opacity="0.13"/>
      ))}
      {[55,75,95,115,135,155,175,195].map((x,i)=>(
        <rect key={i} x={x} y={302} width="11" height="16" rx="1" fill="#ff4400" opacity="0.1"/>
      ))}

      {/* Control tower */}
      <rect x="90" y="165" width="14" height="75" fill="#0a0000" opacity="0.9"/>
      <rect x="78" y="158" width="38" height="16" rx="2" fill="#0a0000" opacity="0.9"/>
      <rect x="93" y="142" width="8" height="20" fill="#0a0000" opacity="0.9"/>
      <circle cx="97" cy="142" r="3" fill="#ff6600" opacity="0.7" filter="url(#ahBlur2)"/>
      {/* Tower glass */}
      {[82,90,98,106].map((x,i)=>(
        <rect key={i} x={x} y={161} width="7" height="10" rx="1" fill="#ff4400" opacity="0.15"/>
      ))}

      {/* Terminal right */}
      <rect x="580" y="290" width="200" height="90" rx="4" fill="#0d0000" opacity="0.8"/>
      <rect x="600" y="270" width="160" height="25" rx="3" fill="#0d0000" opacity="0.8"/>
      {[590,610,630,650,670,690,710,730].map((x,i)=>(
        <rect key={i} x={x} y={300} width="11" height="15" rx="1" fill="#ff4400" opacity="0.1"/>
      ))}

      {/* Airplane — kiri bawah + tengah bawah */}
      <g transform="translate(590,190) rotate(-10)" opacity="0.45">
        <ellipse cx="0" cy="0" rx="45" ry="8" fill="#ddd"/>
        <polygon points="-12,-7 -12,7 25,0" fill="#ccc"/>
        <line x1="-18" y1="0" x2="-50" y2="-26" stroke="#ddd" strokeWidth="3.5"/>
        <line x1="-18" y1="0" x2="-50" y2="26"  stroke="#ddd" strokeWidth="3.5"/>
        <line x1="18"  y1="0" x2="34"  y2="-9"  stroke="#ddd" strokeWidth="2"/>
        {/* Red stripe on tail */}
        <rect x="-50" y="-4" width="8" height="8" rx="1" fill="#cc0000" opacity="0.7"/>
      </g>

      {/* Red diagonal arrows (kiri bawah / kanan bawah) */}
      <g transform="translate(700,80)" opacity="0.5">
        <line x1="0" y1="55" x2="50" y2="5" stroke="#ff2200" strokeWidth="3" strokeLinecap="round"/>
        <polygon points="50,5 40,5 50,15" fill="#ff2200"/>
        <line x1="10" y1="65" x2="60" y2="15" stroke="#ff2200" strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
      </g>

      {/* Speed lines */}
      <line x1="0" y1="420" x2="800" y2="350" stroke="#CC0000" strokeWidth="1" opacity="0.12"/>
      <line x1="0" y1="470" x2="800" y2="410" stroke="#CC0000" strokeWidth="0.5" opacity="0.07"/>

      {/* Vignette */}
      <rect width="800" height="600" fill="black" opacity="0.28"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      const redirect = ROLE_REDIRECTS[user.role] || '/'
      navigate(redirect, { replace: true })
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Email atau password salah'
        : err.code === 'auth/user-not-found'
        ? 'Akun tidak ditemukan'
        : err.code === 'auth/too-many-requests'
        ? 'Terlalu banyak percobaan. Coba lagi nanti.'
        : err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — airport background */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        <AirportHeroBg />
        {/* Red border frame (tengah bawah style) */}
        <div className="absolute inset-5 border border-red-700/35 rounded-2xl pointer-events-none"/>

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <RifimLogoWhite className="h-16 w-auto"/>

          {/* Headline */}
          <div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4 drop-shadow-2xl">
              Kelola Driver<br/>
              <span className="text-red-400">Bandara RIFIM</span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-md mb-8">
              Sistem manajemen driver bandara terpadu — pantau antrian, kehadiran, dan kinerja secara real-time.
            </p>

            {/* Nilai (tengah bawah style) */}
            <div className="flex gap-5 mb-8 flex-wrap">
              {['INTEGRITAS','INOVASI','KUALITAS','KEBERLANJUTAN'].map(v => (
                <div key={v} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full"/>
                  <span className="text-slate-300 text-xs font-semibold tracking-wide">{v}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Cabang Aktif', value: '7' },
                { label: 'Total Driver', value: '300+' },
                { label: 'Penjemputan/Hari', value: '500+' },
              ].map(s => (
                <div key={s.label} className="bg-white/8 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-xl font-black text-red-400">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2025 PT. RIFIM INTERNATIONAL GEMILANG &nbsp;·&nbsp; Melayani Dunia, Menggerakkan Negeri</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center mb-8 lg:hidden">
            <svg viewBox="0 0 310 92" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto">
              <rect x="1" y="1" width="86" height="86" rx="5" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
              <rect x="5" y="5" width="78" height="78" rx="3" fill="#CC0000"/>
              <text x="44" y="64" textAnchor="middle" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="50" fill="white">RI</text>
              <text x="100" y="74" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="68" fill="#CC0000" letterSpacing="-1">FIM</text>
              <text x="2" y="90" fontFamily="Arial" fontSize="9" fill="#888" letterSpacing="0.6">PT. RIFIM INTERNATIONAL GEMILANG</text>
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat Datang</h2>
          <p className="text-slate-500 mb-8 text-sm">Masuk ke akun staff Anda untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@rifim.com" required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"/>
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-900/25"
              style={{ background: 'linear-gradient(135deg,#FF1111 0%,#880000 100%)' }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">
            © 2025 PT. RIFIM INTERNATIONAL GEMILANG
          </p>
        </div>
      </div>
    </div>
  )
}

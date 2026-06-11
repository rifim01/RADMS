import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_REDIRECTS } from '../services/authService'

// Inline RIFIM logo (bold RI|FIM style)
function RifimLogoWhite({ className = '' }) {
  return (
    <svg viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="boxG2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EE1111"/>
          <stop offset="100%" stopColor="#990000"/>
        </linearGradient>
        <filter id="sh2">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <rect x="2" y="2" width="82" height="82" rx="6" fill="url(#boxG2)" filter="url(#sh2)"/>
      <rect x="5" y="5" width="76" height="76" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
      <text x="43" y="64" textAnchor="middle" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="52" fill="white" filter="url(#sh2)">RI</text>
      <line x1="88" y1="8" x2="88" y2="78" stroke="white" strokeWidth="2" opacity="0.3"/>
      <text x="98" y="72" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="66" fill="white" filter="url(#sh2)">FIM</text>
      <text x="2" y="87" fontFamily="Arial,Helvetica,sans-serif" fontWeight="500" fontSize="9" fill="rgba(255,255,255,0.65)" letterSpacing="0.8">PT. RIFIM INTERNATIONAL GEMILANG</text>
    </svg>
  )
}

// Airport runway background
function RunwayBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050508"/>
          <stop offset="50%" stopColor="#1a0303"/>
          <stop offset="100%" stopColor="#440000"/>
        </linearGradient>
        <radialGradient id="lglow" cx="50%" cy="85%" r="70%">
          <stop offset="0%" stopColor="#CC0000" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#CC0000" stopOpacity="0"/>
        </radialGradient>
        <filter id="lb">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>
      <rect width="800" height="600" fill="url(#lsky)"/>
      <ellipse cx="400" cy="700" rx="600" ry="250" fill="url(#lglow)"/>
      {/* Runway */}
      <polygon points="280,600 520,600 440,280 360,280" fill="#111" opacity="0.9"/>
      {/* Centerline dashes */}
      {Array.from({length:14},(_,i)=>(
        <rect key={i} x="399" y={285+i*23} width="2" height="12" rx="1" fill="#CC0000" opacity={0.2+i*0.055}/>
      ))}
      {/* Edge lights L */}
      {Array.from({length:9},(_,i)=>(
        <circle key={i} cx={362-i*8} cy={285+i*35} r="3" fill="#ff3300" opacity={0.35+i*0.07} filter="url(#lb)"/>
      ))}
      {/* Edge lights R */}
      {Array.from({length:9},(_,i)=>(
        <circle key={i} cx={438+i*8} cy={285+i*35} r="3" fill="#ff3300" opacity={0.35+i*0.07} filter="url(#lb)"/>
      ))}
      {/* Terminal silhouette */}
      <rect x="50" y="200" width="160" height="100" fill="#0d0d0d" opacity="0.85"/>
      <rect x="60" y="180" width="140" height="25" fill="#0d0d0d" opacity="0.85"/>
      <rect x="120" y="150" width="20" height="35" fill="#0d0d0d" opacity="0.85"/>
      {/* Terminal windows */}
      {[70,90,110,130,150,165,180].map((x,i)=>(
        <rect key={i} x={x} y={215} width="8" height="14" fill="#ff6600" opacity="0.12"/>
      ))}
      {/* R terminal */}
      <rect x="600" y="220" width="140" height="80" fill="#0d0d0d" opacity="0.8"/>
      <rect x="620" y="200" width="100" height="22" fill="#0d0d0d" opacity="0.8"/>
      {/* Airplane */}
      <g transform="translate(620,130) rotate(-8)" opacity="0.35">
        <ellipse cx="0" cy="0" rx="35" ry="7" fill="#ccc"/>
        <polygon points="-10,-6 -10,6 20,0" fill="#bbb"/>
        <line x1="-15" y1="0" x2="-40" y2="-22" stroke="#ccc" strokeWidth="3"/>
        <line x1="-15" y1="0" x2="-40" y2="22" stroke="#ccc" strokeWidth="3"/>
        <line x1="15" y1="0" x2="30" y2="-8" stroke="#ccc" strokeWidth="2"/>
      </g>
      {/* Speed lines */}
      <line x1="0" y1="400" x2="800" y2="340" stroke="#CC0000" strokeWidth="1" opacity="0.1"/>
      <line x1="0" y1="450" x2="800" y2="400" stroke="#CC0000" strokeWidth="0.5" opacity="0.08"/>
      {/* Vignette */}
      <rect width="800" height="600" fill="black" opacity="0.35"/>
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
      {/* Left panel — airport background, desktop only */}
      <div className="hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden">
        <RunwayBg />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <RifimLogoWhite className="h-16 w-auto" />

          <div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
              Kelola Driver<br/>
              <span className="text-red-400">Bandara RIFIM</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              Sistem manajemen driver bandara terpadu — pantau antrian, kehadiran, dan kinerja driver secara real-time.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: 'Cabang Aktif', value: '7' },
                { label: 'Total Driver', value: '300+' },
                { label: 'Penjemputan/Hari', value: '500+' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-2xl font-bold text-red-400">{stat.value}</p>
                  <p className="text-sm text-slate-300 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-sm">© 2025 PT. RIFIM INTERNATIONAL GEMILANG</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <svg viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto">
              <rect x="2" y="2" width="82" height="82" rx="6" fill="#CC0000"/>
              <text x="43" y="64" textAnchor="middle" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="52" fill="white">RI</text>
              <text x="98" y="72" fontFamily="Impact,Arial Black,Arial,sans-serif" fontWeight="900" fontSize="66" fill="#CC0000">FIM</text>
              <text x="2" y="87" fontFamily="Arial" fontWeight="500" fontSize="9" fill="#888" letterSpacing="0.8">PT. RIFIM INTERNATIONAL GEMILANG</text>
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat Datang</h2>
          <p className="text-slate-500 mb-8">Masuk ke akun staff Anda untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@rifim.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-900/30"
              style={{ background: 'linear-gradient(135deg, #EE1111 0%, #880000 100%)' }}
            >
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

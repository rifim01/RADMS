import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_REDIRECTS } from '../services/authService'

function AirportIllustration() {
  return (
    <svg viewBox="0 0 520 380" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe"/>
          <stop offset="60%" stopColor="#eff6ff"/>
          <stop offset="100%" stopColor="#f8fafc"/>
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0"/>
          <stop offset="100%" stopColor="#cbd5e1"/>
        </linearGradient>
        <linearGradient id="terminalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9"/>
          <stop offset="100%" stopColor="#e2e8f0"/>
        </linearGradient>
        <linearGradient id="redRunway" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#CC0000" stopOpacity="0"/>
          <stop offset="40%" stopColor="#CC0000" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#CC0000" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#CC0000" stopOpacity="0"/>
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.12)"/></filter>
        <filter id="softBlur"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="520" height="380" fill="url(#sky)"/>
      <ellipse cx="80"  cy="55" rx="45" ry="18" fill="white" opacity="0.85" filter="url(#softBlur)"/>
      <ellipse cx="110" cy="48" rx="38" ry="14" fill="white" opacity="0.9"/>
      <ellipse cx="380" cy="70" rx="55" ry="20" fill="white" opacity="0.8" filter="url(#softBlur)"/>
      <ellipse cx="415" cy="62" rx="40" ry="15" fill="white" opacity="0.9"/>
      <ellipse cx="240" cy="35" rx="30" ry="12" fill="white" opacity="0.7"/>
      <rect x="0" y="270" width="520" height="110" fill="url(#groundGrad)"/>
      <rect x="160" y="265" width="200" height="115" fill="#94a3b8" opacity="0.5"/>
      <rect x="257" y="270" width="6" height="105" fill="url(#redRunway)" rx="2"/>
      {[0,1,2,3,4,5].map(i => (
        <rect key={i} x="258" y={278 + i*14} width="4" height="8" rx="1" fill="white" opacity="0.7"/>
      ))}
      {[0,1,2,3,4].map(i => (
        <circle key={`l${i}`} cx={168} cy={278 + i*18} r="3" fill="#CC0000" opacity="0.7"/>
      ))}
      {[0,1,2,3,4].map(i => (
        <circle key={`r${i}`} cx={352} cy={278 + i*18} r="3" fill="#CC0000" opacity="0.7"/>
      ))}
      <rect x="50" y="145" width="300" height="130" rx="4" fill="url(#terminalGrad)" filter="url(#shadow)"/>
      <rect x="50" y="145" width="300" height="8" rx="4" fill="#e2e8f0"/>
      <rect x="50" y="145" width="300" height="4" fill="#CC0000" opacity="0.7"/>
      {[65,90,115,140,165,190,215,240,265,290,315].map((x,i) => (
        <rect key={i} x={x} y={162} width={16} height={20} rx="2" fill="#bfdbfe" opacity="0.8" stroke="#93c5fd" strokeWidth="0.5"/>
      ))}
      {[65,90,115,140,165,190,215,240,265,290,315].map((x,i) => (
        <rect key={i} x={x} y={196} width={16} height={20} rx="2" fill="#bfdbfe" opacity="0.6" stroke="#93c5fd" strokeWidth="0.5"/>
      ))}
      <rect x="160" y="225" width="80" height="50" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
      <rect x="185" y="228" width="14" height="40" rx="1" fill="#bfdbfe" opacity="0.5"/>
      <rect x="201" y="228" width="14" height="40" rx="1" fill="#bfdbfe" opacity="0.5"/>
      <rect x="380" y="120" width="14" height="145" rx="2" fill="#e2e8f0"/>
      <rect x="372" y="118" width="30" height="16" rx="3" fill="#cbd5e1"/>
      <rect x="376" y="105" width="22" height="16" rx="2" fill="#e2e8f0"/>
      <rect x="376" y="107" width="8"  height="12" rx="1" fill="#93c5fd" opacity="0.7"/>
      <rect x="386" y="107" width="8"  height="12" rx="1" fill="#93c5fd" opacity="0.7"/>
      <circle cx="387" cy="103" r="3.5" fill="#CC0000" opacity="0.85"/>
      <circle cx="387" cy="103" r="6"   fill="#CC0000" opacity="0.2"/>
      <rect x="350" y="200" width="32" height="12" rx="2" fill="#cbd5e1" opacity="0.8"/>
      <rect x="324" y="195" width="28" height="12" rx="2" fill="#cbd5e1" opacity="0.7" transform="rotate(-8 324 195)"/>
      <g transform="translate(95,210) rotate(-8)" filter="url(#shadow)">
        <ellipse cx="0" cy="0" rx="52" ry="9" fill="#f1f5f9"/>
        <ellipse cx="40" cy="-1" rx="14" ry="6" fill="#e2e8f0"/>
        <rect x="-52" y="-2" width="104" height="4" rx="2" fill="#CC0000" opacity="0.8"/>
        <polygon points="-10,-9 -10,9 -50,24 -50,-24" fill="#e2e8f0" opacity="0.9"/>
        <polygon points="-10,-9 -10,9 -50,24 -50,-24" fill="#CC0000" opacity="0.12"/>
        <polygon points="42,-9 52,-9 52,-30 38,-12" fill="#e2e8f0"/>
        <polygon points="42,-9 52,-9 52,-30 38,-12" fill="#CC0000" opacity="0.3"/>
        <ellipse cx="-30" cy="16" rx="10" ry="5" fill="#cbd5e1"/>
        <ellipse cx="-30" cy="-16" rx="10" ry="5" fill="#cbd5e1"/>
        <ellipse cx="-52" cy="0" rx="6" ry="5" fill="#dde4ec"/>
      </g>
      <rect x="200" y="285" width="24" height="12" rx="2" fill="#64748b" opacity="0.5"/>
      <rect x="230" y="290" width="30" height="9"  rx="2" fill="#94a3b8" opacity="0.5"/>
      <path d="M0,310 Q130,290 260,300 Q390,310 520,295" fill="none" stroke="#CC0000" strokeWidth="1.5" opacity="0.15"/>
      <path d="M0,330 Q130,315 260,320 Q390,325 520,315" fill="none" stroke="#CC0000" strokeWidth="1" opacity="0.1"/>
    </svg>
  )
}

function RifimLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 310 92" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="lgBg" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FF1111"/>
          <stop offset="50%" stopColor="#CC0000"/>
          <stop offset="100%" stopColor="#880000"/>
        </linearGradient>
        <linearGradient id="lgFim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EE1111"/>
          <stop offset="100%" stopColor="#880000"/>
        </linearGradient>
        <filter id="lgSh">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <rect x="1" y="1" width="86" height="86" rx="5" fill="none" stroke="#CC0000" strokeWidth="3"/>
      <rect x="5" y="5" width="78" height="78" rx="3" fill="url(#lgBg)" filter="url(#lgSh)"/>
      <rect x="5" y="5" width="78" height="12" rx="3" fill="rgba(255,255,255,0.15)"/>
      <text x="44" y="64" textAnchor="middle" fontFamily="Impact,Arial Black,Arial,sans-serif"
        fontWeight="900" fontSize="50" fill="white" filter="url(#lgSh)" letterSpacing="-1">RI</text>
      <line x1="91" y1="10" x2="91" y2="78" stroke="#CC0000" strokeWidth="2.5" opacity="0.3"/>
      <text x="100" y="74" fontFamily="Impact,Arial Black,Arial,sans-serif"
        fontWeight="900" fontSize="68" fill="url(#lgFim)" filter="url(#lgSh)" letterSpacing="-1">FIM</text>
      <g transform="translate(261,12)">
        <line x1="0" y1="22" x2="22" y2="0" stroke="#CC0000" strokeWidth="3" strokeLinecap="round"/>
        <polygon points="22,0 14,0 22,8" fill="#CC0000"/>
      </g>
      <text x="2" y="90" fontFamily="Arial,Helvetica,sans-serif" fontWeight="600"
        fontSize="9" fill="#555" letterSpacing="0.6">PT. RIFIM INTERNATIONAL GEMILANG</text>
    </svg>
  )
}

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'rifim01@adminrifim.org', password: 'Admin@Rifim2025', role: 'Super Admin' },
  { label: 'Pipin Admin',  email: 'pipin@adminrifim.org',  password: 'Admin@Rifim2025', role: 'Super Admin' },
]

export default function LoginPage() {
  const navigate   = useNavigate()
  const { login }  = useAuth()
  const [email,    setEmail]    = useState('rifim01@adminrifim.org')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (result.success) {
        navigate(ROLE_REDIRECTS[result.user?.role] || '/', { replace: true })
      } else {
        setError(result.error || 'Login gagal. Periksa email dan password.')
      }
    } catch {
      setError('Terjadi kesalahan koneksi. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(acc) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col bg-white border-r border-slate-200 relative overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-red-600 to-red-800 w-full"/>
        <div className="px-10 pt-10 pb-6">
          <RifimLogo className="h-16 w-auto"/>
          <div className="flex items-center gap-4 mt-3">
            {['INTEGRITAS','INOVASI','KUALITAS','KEBERLANJUTAN'].map(v => (
              <span key={v} className="text-red-600/70 text-[8px] tracking-widest font-bold uppercase">{v}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 px-8 pb-6">
          <AirportIllustration />
        </div>
        <div className="px-10 pb-8">
          <div className="flex items-center gap-8 bg-slate-50 rounded-2xl p-4 border border-slate-200">
            {[
              { n: '7',    l: 'Cabang' },
              { n: '300+', l: 'Driver' },
              { n: '500+', l: 'Penjemputan/Hari' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-red-600 font-black text-xl leading-none">{s.n}</p>
                <p className="text-slate-500 text-xs mt-1">{s.l}</p>
              </div>
            ))}
            <div className="ml-auto text-right">
              <p className="text-slate-700 font-semibold text-sm">Staff Dashboard</p>
              <p className="text-slate-400 text-xs">RADMS v1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:px-12 bg-white lg:bg-slate-50">
        <div className="lg:hidden mb-8 w-full">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-800 rounded-full mb-6"/>
          <RifimLogo className="h-12 w-auto"/>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800">Masuk ke Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manajemen driver & operasional bandara</p>
          </div>

          <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-red-700 text-xs font-bold mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
              Akun Tersedia
            </p>
            <div className="space-y-1">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center justify-between bg-white hover:bg-red-50 border border-red-100 hover:border-red-300 rounded-lg px-3 py-2 transition group"
                >
                  <div className="text-left">
                    <p className="text-slate-700 text-xs font-semibold">{acc.label}</p>
                    <p className="text-slate-400 text-[10px]">{acc.email}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:text-red-600 transition"/>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"/>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required disabled={loading}
                  placeholder="admin@rifim.com"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-slate-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  required disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-12 text-sm placeholder:text-slate-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-3.5 mt-2 transition-all text-sm shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#FF1111 0%,#880000 100%)' }}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Memverifikasi...</span></>
              ) : (
                <span>Masuk ke Dashboard</span>
              )}
            </button>
          </form>

          <p className="text-center text-slate-300 text-xs mt-8">
            &copy; 2025 PT. RIFIM INTERNATIONAL GEMILANG
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_REDIRECTS } from '../services/authService'

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'rifim01@adminrifim.org', password: 'Admin@Rifim2025', role: 'Super Admin' },
  { label: 'Pipin Admin',  email: 'pipin@adminrifim.org',  password: 'Admin@Rifim2025', role: 'Super Admin' },
]

export default function LoginPage() {
  const navigate   = useNavigate()
  const { login }  = useAuth()
  const [email,    setEmail]    = useState('rifim01@adminrifim.org')
  const [password, setPassword] = useState('Admin@Rifim2025')
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
    <div className="min-h-screen flex bg-slate-900">

      {/* ─── Left panel — photo background (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        {/* Background photo */}
        <img
          src="/hero-bg.png"
          alt="RIFIM Airport"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-red-900/50"/>

        {/* Top accent bar */}
        <div className="relative z-10 h-1.5 bg-gradient-to-r from-red-600 to-red-400 w-full"/>

        {/* Logo */}
        <div className="relative z-10 px-10 pt-10">
          <img src="/rifim-logo.png" alt="RIFIM Logo" className="h-20 w-auto object-contain drop-shadow-2xl"/>
          <div className="flex items-center gap-4 mt-3">
            {['INTEGRITAS','INOVASI','KUALITAS','KEBERLANJUTAN'].map(v => (
              <span key={v} className="text-white/50 text-[8px] tracking-widest font-bold uppercase">{v}</span>
            ))}
          </div>
        </div>

        {/* Stats bar at bottom */}
        <div className="relative z-10 mt-auto px-10 pb-10">
          <div className="flex items-center gap-8 bg-black/40 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            {[
              { n: '7',    l: 'Cabang' },
              { n: '300+', l: 'Driver' },
              { n: '500+', l: 'Penjemputan/Hari' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-red-400 font-black text-2xl leading-none">{s.n}</p>
                <p className="text-white/60 text-xs mt-1">{s.l}</p>
              </div>
            ))}
            <div className="ml-auto text-right">
              <p className="text-white font-semibold text-sm">Staff Dashboard</p>
              <p className="text-white/40 text-xs">RADMS v1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right panel — login form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:px-12 bg-white">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 w-full">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-800 rounded-full mb-6"/>
          <img src="/rifim-logo.png" alt="RIFIM Logo" className="h-14 w-auto object-contain"/>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800">Masuk ke Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manajemen driver & operasional bandara</p>
          </div>

          {/* Quick accounts */}
          <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-red-700 text-xs font-bold mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
              Akun Tersedia
            </p>
            <div className="space-y-1">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} type="button" onClick={() => fillDemo(acc)}
                  className="w-full flex items-center justify-between bg-white hover:bg-red-50 border border-red-100 hover:border-red-300 rounded-lg px-3 py-2 transition group">
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
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                  placeholder="admin@rifim.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition"/>
              </div>
            </div>
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pl-10 pr-12 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition"/>
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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Memverifikasi...</span></>
              ) : <span>Masuk ke Dashboard</span>}
            </button>
          </form>
          <p className="text-center text-slate-300 text-xs mt-8">&copy; 2025 PT. RIFIM INTERNATIONAL GEMILANG</p>
        </div>
      </div>
    </div>
  )
}

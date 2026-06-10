import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Plane, Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_REDIRECTS } from '../services/authService'

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
      const user = login(email.trim(), password)
      const redirect = ROLE_REDIRECTS[user.role] || '/'
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { label: 'Super Admin', email: 'super@rifim.com', pass: 'admin123', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Koordinator', email: 'coord@rifim.com', pass: 'coord123', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Staf', email: 'staff@rifim.com', pass: 'staff123', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ]

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl">RADMS</p>
            <p className="text-xs text-blue-300">RIFIM Airport Driver Management</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Kelola Driver Bandara<br />
            <span className="text-blue-400">Lebih Efisien</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Sistem manajemen driver bandara terpadu untuk memantau antrian, kehadiran, dan kinerja driver secara real-time.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Bandara Aktif', value: '3' },
              { label: 'Total Driver', value: '75+' },
              { label: 'Penjemputan/Hari', value: '227+' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-blue-300">{stat.value}</p>
                <p className="text-sm text-slate-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-sm">© 2026 RIFIM. Semua hak dilindungi.</p>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800">RADMS</p>
              <p className="text-xs text-slate-500">RIFIM Driver Management</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat Datang</h2>
          <p className="text-slate-500 mb-8">Masuk ke akun Anda untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
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
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-slate-400 text-center mb-3">— Akun Demo —</p>
            <div className="space-y-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.pass) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition hover:opacity-80 ${acc.color}`}
                >
                  <span>{acc.label}</span>
                  <span className="font-mono opacity-70">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

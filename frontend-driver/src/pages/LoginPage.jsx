import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Masukkan nomor HP Anda.');
      return;
    }
    if (!password.trim()) {
      setError('Masukkan password Anda.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(phone, password);
      if (result.success) {
        navigate('/home', { replace: true });
      } else {
        setError(result.error || 'Login gagal. Coba lagi.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value) => {
    // Bersihkan non-digit, maksimal 13 karakter
    return value.replace(/\D/g, '').slice(0, 13);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top decorative section */}
      <div className="relative flex-shrink-0 h-56 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-login" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-login)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-3">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white">RADMS Driver</h1>
          <p className="text-slate-400 text-sm mt-1">Bandara Sultan Hasanuddin Makassar</p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex flex-col justify-start bg-slate-950 rounded-t-3xl -mt-6 px-6 pt-8 pb-6">
        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold">Masuk</h2>
          <p className="text-slate-400 text-sm mt-1">Masuk ke akun driver Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Phone input */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2 ml-1">
              Nomor HP
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Phone className="w-5 h-5 text-slate-500" />
                <div className="w-px h-5 bg-slate-600" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                placeholder="081234567890"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                autoComplete="tel"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-500" />
                <div className="w-px h-5 bg-slate-600" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-4 pl-16 pr-12 text-base placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl py-4 mt-6 transition-colors text-base shadow-lg shadow-blue-600/20"
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

        {/* Demo hint */}
        <div className="mt-8 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-slate-400 text-xs font-medium mb-2 text-center">Akun Demo</p>
          <div className="space-y-1.5 text-xs text-slate-500">
            {[
              { phone: '081234567890', name: 'Ahmad Syarifuddin' },
              { phone: '082345678901', name: 'Budi Santoso' },
              { phone: '083456789012', name: 'Siti Rahmawati' },
            ].map((acc) => (
              <button
                key={acc.phone}
                type="button"
                onClick={() => { setPhone(acc.phone); setPassword('123456'); setError(''); }}
                className="w-full flex justify-between items-center px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left"
              >
                <span className="text-slate-300">{acc.name}</span>
                <span className="text-slate-500 font-mono">{acc.phone}</span>
              </button>
            ))}
            <p className="text-center text-slate-600 mt-2">Password semua akun: <span className="font-mono text-slate-400">123456</span></p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          &copy; 2025 RIFIM Airport Management. v1.0.0
        </p>
      </div>
    </div>
  );
}

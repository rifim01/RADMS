import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import RifimLogo from '../components/RifimLogo.jsx';

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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #b91c1c 0%, #7f1d1d 45%, #1a0505 100%)' }}>
      {/* Header branding */}
      <div className="relative flex-shrink-0 flex flex-col items-center justify-center pt-14 pb-10 px-6 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-[-30px] left-[-40px] w-48 h-48 rounded-full bg-white/5" />

        <RifimLogo className="h-16 w-auto mb-4" />
        <p className="text-red-200 text-sm mt-1 tracking-wide">Driver Management System</p>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col bg-white rounded-t-3xl px-6 pt-8 pb-8">
        <div className="mb-6">
          <h2 className="text-gray-800 text-2xl font-bold">Masuk</h2>
          <p className="text-gray-400 text-sm mt-1">Masuk ke akun driver Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* NIK */}
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

          {/* Nama */}
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
            className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-4 mt-4 transition-all text-base shadow-lg shadow-red-700/30 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
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

        <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4">
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

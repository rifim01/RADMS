import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

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
    <div className="min-h-screen flex flex-col bg-gray-900">

      {/* Hero Banner */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 260 }}>
        <img
          src="/hero-bg.png"
          alt="RIFIM Airport"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"/>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <span className="text-white/60 text-[9px] tracking-widest font-bold uppercase">FIM</span>
            <div className="w-px h-3 bg-white/30"/>
            <span className="text-white/60 text-[9px] tracking-widest font-bold uppercase">DRIVER APP</span>
          </div>
          <span className="text-white/40 text-[9px] font-medium">PT. RIFIM INTERNATIONAL GEMILANG</span>
        </div>

        {/* Logo + Title centered */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full -mt-6">
          <img
            src="/rifim-logo.png"
            alt="RIFIM Logo"
            className="h-20 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-4 left-0 right-0 z-10 text-center">
          <div className="flex items-center justify-center gap-3">
            {['INTEGRITAS','INOVASI','KUALITAS'].map(v => (
              <span key={v} className="text-white/50 text-[8px] tracking-widest font-bold uppercase">{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* White Card Form */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-5 px-6 pt-7 pb-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-800">Masuk ke Akun Driver</h2>
          <p className="text-sm text-gray-400 mt-0.5">Gunakan NIK & nama terdaftar di sistem RIFIM</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-3.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#CC0000' }}/>
              <p className="text-sm" style={{ color: '#CC0000' }}>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">ID Driver (NIK)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                <CreditCard className="w-5 h-5"/>
              </div>
              <input type="text" inputMode="numeric" value={nik}
                onChange={e => setNik(e.target.value.replace(/\D/g,'').slice(0,20))}
                placeholder="Masukkan NIK / ID Driver"
                className="w-full rounded-2xl py-3.5 pl-12 pr-4 text-base text-gray-800 placeholder-gray-300 border transition-all focus:outline-none"
                style={{
                  background: '#f8f9fa',
                  borderColor: nik ? '#CC0000' : '#e9ecef',
                  boxShadow: nik ? '0 0 0 3px rgba(204,0,0,0.08)' : 'none'
                }}
                disabled={loading}/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                <User className="w-5 h-5"/>
              </div>
              <input type="text" value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Nama sesuai data RIFIM"
                className="w-full rounded-2xl py-3.5 pl-12 pr-4 text-base text-gray-800 placeholder-gray-300 border transition-all focus:outline-none"
                style={{
                  background: '#f8f9fa',
                  borderColor: nama ? '#CC0000' : '#e9ecef',
                  boxShadow: nama ? '0 0 0 3px rgba(204,0,0,0.08)' : 'none'
                }}
                disabled={loading}/>
            </div>
          </div>

          <button type="submit" disabled={loading || !nik || !nama}
            className="w-full flex items-center justify-center gap-2.5 text-white font-bold rounded-2xl py-4 mt-2 transition-all text-base disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #CC0000 0%, #990000 100%)',
              boxShadow: (!loading && nik && nama) ? '0 6px 20px rgba(204,0,0,0.35)' : 'none'
            }}>
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5"/>
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 rounded-2xl p-4" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
          <p className="text-xs font-bold mb-1.5" style={{ color: '#CC0000' }}>Cara Login</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• <span className="font-semibold text-gray-700">ID Driver</span> = NIK terdaftar di sistem RIFIM</li>
            <li>• <span className="font-semibold text-gray-700">Nama</span> = nama sesuai data (minimal kata pertama)</li>
            <li>• Hubungi koordinator jika lupa NIK Anda</li>
          </ul>
        </div>

        <p className="text-center text-gray-300 text-[11px] mt-6">
          &copy; 2025 PT. RIFIM INTERNATIONAL GEMILANG
        </p>
      </div>
    </div>
  );
}

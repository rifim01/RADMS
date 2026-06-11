import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import RifimLogo from '../components/RifimLogo.jsx';

function HeroBg() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe"/>
          <stop offset="50%" stopColor="#dbeafe"/>
          <stop offset="100%" stopColor="#eff6ff"/>
        </linearGradient>
        <linearGradient id="hGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0"/>
          <stop offset="100%" stopColor="#cbd5e1"/>
        </linearGradient>
        <linearGradient id="hTerminal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9"/>
          <stop offset="100%" stopColor="#e2e8f0"/>
        </linearGradient>
        <filter id="hBlur"><feGaussianBlur stdDeviation="2"/></filter>
        <filter id="hShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/></filter>
      </defs>
      <rect width="400" height="260" fill="url(#hSky)"/>
      <ellipse cx="60" cy="40" rx="38" ry="14" fill="white" opacity="0.9" filter="url(#hBlur)"/>
      <ellipse cx="85" cy="34" rx="28" ry="10" fill="white" opacity="0.95"/>
      <ellipse cx="310" cy="50" rx="45" ry="16" fill="white" opacity="0.85" filter="url(#hBlur)"/>
      <ellipse cx="340" cy="44" rx="32" ry="12" fill="white"/>
      <rect x="0" y="195" width="400" height="65" fill="url(#hGround)"/>
      <rect x="140" y="192" width="120" height="68" fill="#94a3b8" opacity="0.4"/>
      <rect x="197" y="196" width="6" height="60" fill="#CC0000" opacity="0.5" rx="2"/>
      {[0,1,2,3].map(i => (<rect key={i} x="198" y={201+i*12} width="4" height="7" rx="1" fill="white" opacity="0.7"/>))}
      {[0,1,2,3].map(i => (<circle key={`l${i}`} cx={147} cy={200+i*14} r="2.5" fill="#CC0000" opacity="0.7"/>))}
      {[0,1,2,3].map(i => (<circle key={`r${i}`} cx={253} cy={200+i*14} r="2.5" fill="#CC0000" opacity="0.7"/>))}
      <rect x="30" y="115" width="220" height="85" rx="3" fill="url(#hTerminal)" filter="url(#hShadow)"/>
      <rect x="30" y="115" width="220" height="5" rx="3" fill="#CC0000" opacity="0.7"/>
      {[42,64,86,108,130,152,174,196,218].map((x,i) => (<rect key={i} x={x} y={128} width={14} height={16} rx="2" fill="#bfdbfe" opacity="0.8"/>))}
      {[42,64,86,108,130,152,174,196,218].map((x,i) => (<rect key={i} x={x} y={153} width={14} height={16} rx="2" fill="#bfdbfe" opacity="0.5"/>))}
      <rect x="115" y="165" width="50" height="35" rx="2" fill="#f8fafc" stroke="#e2e8f0"/>
      <rect x="296" y="90" width="10" height="110" rx="2" fill="#e2e8f0"/>
      <rect x="289" y="87" width="24" height="12" rx="2" fill="#cbd5e1"/>
      <rect x="293" y="76" width="16" height="13" rx="2" fill="#e2e8f0"/>
      <rect x="293" y="78" width="6" height="9" rx="1" fill="#93c5fd" opacity="0.7"/>
      <rect x="301" y="78" width="6" height="9" rx="1" fill="#93c5fd" opacity="0.7"/>
      <circle cx="301" cy="74" r="3" fill="#CC0000" opacity="0.85"/>
      <circle cx="301" cy="74" r="5.5" fill="#CC0000" opacity="0.2"/>
      <g transform="translate(100,148) rotate(-5)" filter="url(#hShadow)">
        <ellipse cx="0" cy="0" rx="40" ry="7" fill="#f1f5f9"/>
        <rect x="-40" y="-2" width="80" height="4" rx="2" fill="#CC0000" opacity="0.75"/>
        <polygon points="-8,-7 -8,7 -38,18 -38,-18" fill="#e2e8f0" opacity="0.9"/>
        <polygon points="30,-7 40,-7 40,-24 26,-10" fill="#e2e8f0"/>
        <ellipse cx="-40" cy="0" rx="5" ry="4" fill="#dde4ec"/>
      </g>
      <path d="M0,230 Q100,218 200,225 Q300,232 400,220" fill="none" stroke="#CC0000" strokeWidth="1.5" opacity="0.18"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="relative flex-shrink-0 h-60 overflow-hidden">
        <HeroBg />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-800"/>
        <div className="absolute inset-3 border border-red-300/40 rounded-2xl pointer-events-none"/>
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
          <RifimLogo className="h-16 w-auto" variant="light"/>
          <div className="flex items-center gap-4 mt-1">
            {['INTEGRITAS','INOVASI','KUALITAS'].map(v => (
              <span key={v} className="text-red-700/70 text-[9px] tracking-widest font-bold uppercase">{v}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white rounded-t-3xl -mt-4 px-6 pt-8 pb-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-slate-800 text-2xl font-bold">Masuk</h2>
          <p className="text-slate-400 text-sm mt-1">Masuk ke akun driver Anda</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-slate-500 text-xs font-medium mb-2 ml-1">ID Driver (NIK)</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-400"/>
                <div className="w-px h-5 bg-slate-200"/>
              </div>
              <input type="text" inputMode="numeric" value={nik}
                onChange={e => setNik(e.target.value.replace(/\D/g,'').slice(0,20))}
                placeholder="Masukkan NIK / ID Driver"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-slate-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition-colors"
                disabled={loading}/>
            </div>
          </div>
          <div>
            <label className="block text-slate-500 text-xs font-medium mb-2 ml-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-400"/>
                <div className="w-px h-5 bg-slate-200"/>
              </div>
              <input type="text" value={nama} onChange={e => setNama(e.target.value)}
                placeholder="Nama sesuai data RIFIM"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-4 pl-16 pr-4 text-base placeholder:text-slate-300 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300 transition-colors"
                disabled={loading}/>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl py-4 mt-4 transition-all text-base shadow-lg shadow-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#FF1111 0%,#880000 100%)' }}>
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Memverifikasi...</span></>
            ) : (
              <><LogIn className="w-5 h-5"/><span>Masuk</span></>
            )}
          </button>
        </form>
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-slate-700 text-xs font-semibold mb-2">Cara Login:</p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• <span className="text-slate-700 font-medium">ID Driver</span> = NIK terdaftar di sistem RIFIM</li>
            <li>• <span className="text-slate-700 font-medium">Nama</span> = nama sesuai data (minimal kata pertama)</li>
            <li>• Hubungi koordinator jika lupa NIK Anda</li>
          </ul>
        </div>
        <p className="text-center text-slate-300 text-xs mt-auto pt-6">&copy; 2025 PT. RIFIM INTERNATIONAL GEMILANG</p>
      </div>
    </div>
  );
}

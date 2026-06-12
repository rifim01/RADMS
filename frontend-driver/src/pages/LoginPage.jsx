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
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f9fa' }}>

      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 shadow-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: '#CC0000' }}>
          <span className="text-white font-black text-lg leading-none tracking-tight">RI</span>
        </div>
        <div>
          <div className="font-black text-lg leading-none" style={{ color: '#CC0000' }}>FIM</div>
          <div className="text-[9px] text-gray-400 tracking-wider font-medium leading-none mt-0.5">DRIVER APP</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] text-gray-400 font-medium">PT. RIFIM INTERNATIONAL GEMILANG</div>
        </div>
      </div>

      {/* Illustration Banner */}
      <div className="relative overflow-hidden" style={{ height: 200, background: 'linear-gradient(160deg, #fff 0%, #fff5f5 60%, #ffeaea 100%)' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff"/>
              <stop offset="100%" stopColor="#fdecea"/>
            </linearGradient>
            <linearGradient id="termG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4f7fb"/>
              <stop offset="100%" stopColor="#e1e8f0"/>
            </linearGradient>
          </defs>
          <rect width="390" height="200" fill="url(#skyG)"/>
          <rect x="0"   y="120" width="25"  height="80" fill="#e8edf2" opacity="0.5"/>
          <rect x="20"  y="100" width="20"  height="100" fill="#dde4ec" opacity="0.5"/>
          <rect x="35"  y="110" width="30"  height="90" fill="#e4eaf2" opacity="0.5"/>
          <rect x="310" y="105" width="30"  height="95" fill="#e4eaf2" opacity="0.5"/>
          <rect x="335" y="90"  width="22"  height="110" fill="#dde4ec" opacity="0.5"/>
          <rect x="352" y="115" width="38"  height="85" fill="#e8edf2" opacity="0.5"/>
          <path d="M-10,180 Q100,155 200,165 Q300,175 410,150" fill="none" stroke="#CC0000" strokeWidth="2" opacity="0.12"/>
          <path d="M-10,190 Q120,168 220,175 Q320,182 410,162" fill="none" stroke="#CC0000" strokeWidth="1.5" opacity="0.08"/>
          <rect x="0" y="160" width="390" height="40" fill="#edf0f4"/>
          <rect x="100" y="158" width="190" height="42" fill="#d1d9e2" opacity="0.6"/>
          {[0,1,2,3,4,5].map(i => (
            <rect key={i} x="192" y={162+i*6} width="5" height="4" rx="1" fill="white" opacity="0.9"/>
          ))}
          {[0,1,2,3,4].map(i => (
            <circle key={`l${i}`} cx={107} cy={163+i*8} r="2" fill="#CC0000" opacity="0.8"/>
          ))}
          {[0,1,2,3,4].map(i => (
            <circle key={`r${i}`} cx={283} cy={163+i*8} r="2" fill="#CC0000" opacity="0.8"/>
          ))}
          <rect x="60"  y="90"  width="220" height="75" rx="4" fill="url(#termG)"/>
          <rect x="60"  y="90"  width="220" height="6"  rx="4" fill="#CC0000" opacity="0.85"/>
          {[75,97,119,141,163,185,207,229,251].map((x,i) => (
            <rect key={i} x={x} y={105} width={14} height={18} rx="2" fill="#c7e0f4" opacity="0.85"/>
          ))}
          {[75,97,119,141,163,185,207,229,251].map((x,i) => (
            <rect key={i} x={x} y={130} width={14} height={14} rx="2" fill="#c7e0f4" opacity="0.45"/>
          ))}
          <rect x="60"  y="155" width="40"  height="10" rx="2" fill="#cdd5de"/>
          <rect x="242" y="155" width="38"  height="10" rx="2" fill="#cdd5de"/>
          <rect x="150" y="148" width="40"  height="18" rx="2" fill="#e8f4fd" stroke="#c7d8e8" strokeWidth="0.5"/>
          <rect x="310" y="68"  width="9"   height="95" rx="2" fill="#d5dce6"/>
          <rect x="305" y="65"  width="19"  height="10" rx="2" fill="#c8d2de"/>
          <rect x="307" y="54"  width="15"  height="13" rx="2" fill="#dce4ee"/>
          <rect x="308" y="56"  width="5"   height="9"  rx="1" fill="#93c5fd" opacity="0.8"/>
          <rect x="315" y="56"  width="5"   height="9"  rx="1" fill="#93c5fd" opacity="0.8"/>
          <circle cx="314" cy="52" r="2.5" fill="#CC0000"/>
          <circle cx="314" cy="52" r="5"   fill="#CC0000" opacity="0.15"/>
          <g transform="translate(180,130) rotate(-6)">
            {/* Fuselage */}
            <ellipse cx="0" cy="0" rx="52" ry="8" fill="#f1f5f9"/>
            {/* Red stripe */}
            <rect x="-52" y="-2" width="104" height="4" rx="2" fill="#CC0000" opacity="0.8"/>
            {/* Main wing - stays below fuselage */}
            <polygon points="-8,-7 -8,7 -46,20 -46,-20" fill="#e2e8f0" opacity="0.9"/>
            {/* Tail fin - short, stays within body */}
            <polygon points="40,-7 50,-7 44,-18 36,-9" fill="#e2e8f0"/>
            {/* Nose */}
            <ellipse cx="52" cy="0" rx="6" ry="5" fill="#dde4ec"/>
            {/* Engine pods */}
            <ellipse cx="-22" cy="14" rx="9" ry="4" fill="#cbd5e1"/>
            <ellipse cx="-22" cy="-14" rx="9" ry="4" fill="#cbd5e1"/>
          </g>
          <circle cx="365" cy="175" r="22" fill="none" stroke="#CC0000" strokeWidth="1.5" opacity="0.15"/>
          <circle cx="365" cy="175" r="15" fill="none" stroke="#CC0000" strokeWidth="1" opacity="0.1"/>
          <path d="M30,58 L30,42 M25,47 L30,42 L35,47" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
        </svg>
        <div className="absolute bottom-5 left-5">
          <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Selamat Datang</div>
          <div className="text-lg font-black text-gray-800 leading-tight">RIFIM Driver Portal</div>
        </div>
        <div className="absolute top-4 right-5 flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CC0000', opacity: 0.7 }}/>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CC0000', opacity: 0.4 }}/>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CC0000', opacity: 0.2 }}/>
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

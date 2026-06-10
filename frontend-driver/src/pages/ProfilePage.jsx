import React, { useState } from 'react';
import {
  User, Car, Phone, Star, Award, Calendar, Shield, LogOut,
  Edit3, MapPin, ChevronRight, Settings, HelpCircle, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatDate, formatPhone } from '../utils/formatters.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { driver, logout } = useAuth();
  const { history, airport } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const completedTrips = history.filter((h) => h.status === 'COMPLETED');
  const totalEarnings = completedTrips.reduce((sum, t) => sum + t.fare, 0);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      group: 'Akun',
      items: [
        { icon: Edit3, label: 'Edit Profil', desc: 'Ubah informasi pribadi', action: null },
        { icon: Shield, label: 'Keamanan', desc: 'Password & verifikasi', action: null },
        { icon: Settings, label: 'Pengaturan', desc: 'Preferensi aplikasi', action: null },
      ],
    },
    {
      group: 'Bantuan',
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan', desc: 'FAQ & panduan penggunaan', action: null },
        { icon: FileText, label: 'Syarat & Ketentuan', desc: 'Kebijakan layanan', action: null },
        { icon: MapPin, label: 'Tentang Bandara', desc: airport?.name || 'Bandara Sultan Hasanuddin', action: null },
      ],
    },
  ];

  const initials = driver?.name
    ? driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DR';

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header title="Profil Saya" />

      <div className="px-4 py-4 space-y-4">
        {/* Profile card */}
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              {driver?.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg leading-tight">{driver?.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 text-sm">{formatPhone(driver?.phone || '')}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 text-sm truncate">{airport?.name}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold">{driver?.rating ?? '-'}</span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{driver?.totalTrips?.toLocaleString('id-ID') ?? '-'}</p>
              <p className="text-slate-500 text-xs mt-0.5">Total Trip</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-sm">
                {(totalEarnings / 1000).toFixed(0)}K
              </p>
              <p className="text-slate-500 text-xs mt-0.5">Pendapatan</p>
            </div>
          </div>
        </div>

        {/* Vehicle info */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-5 h-5 text-blue-400" />
            <p className="text-white font-semibold">Informasi Kendaraan</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Jenis', value: driver?.vehicleType },
              { label: 'Plat Nomor', value: driver?.vehiclePlate },
              { label: 'Model', value: driver?.vehicleModel },
              { label: 'No. SIM', value: driver?.licenseNumber },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className="text-slate-200 text-sm font-medium">{value || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-400" />
            <p className="text-white font-semibold">Informasi Akun</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Bergabung', value: driver?.joinDate ? formatDate(driver.joinDate) : '-' },
              { label: 'Status Akun', value: driver?.status === 'active' ? 'Aktif' : 'Tidak Aktif' },
              { label: 'Verifikasi', value: driver?.verified ? 'Terverifikasi' : 'Belum Terverifikasi' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className={`text-sm font-medium ${
                  label === 'Status Akun' && value === 'Aktif' ? 'text-green-400' :
                  label === 'Verifikasi' && value === 'Terverifikasi' ? 'text-blue-400' :
                  'text-slate-200'
                }`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu groups */}
        {menuItems.map((group) => (
          <div key={group.group} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{group.group}</p>
            </div>
            {group.items.map((item, idx) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/40 transition-colors text-left ${
                  idx < group.items.length - 1 ? 'border-b border-slate-700/30' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-slate-400" style={{ width: '18px', height: '18px' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium">{item.label}</p>
                  <p className="text-slate-500 text-xs truncate">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
        ))}

        {/* Logout button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/15 text-red-400 rounded-2xl py-4 font-semibold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar dari Akun
        </button>

        <p className="text-center text-slate-600 text-xs pb-2">
          RADMS Driver v1.0.0 &copy; 2025 RIFIM
        </p>
      </div>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Keluar?</h3>
              <p className="text-slate-400 text-sm mt-1">
                Anda akan keluar dari akun {driver?.name?.split(' ')[0]}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-bold transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

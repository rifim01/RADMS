import React, { useState, useEffect } from 'react';
import {
  User, Star, Award, Shield, LogOut,
  Edit3, MapPin, ChevronRight, Settings, HelpCircle, FileText, CreditCard,
  Bell, Volume2, Moon, Sun, X, ChevronDown, ChevronUp, Check, Lock,
  Phone, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';

const SETTINGS_KEY = 'radms_driver_settings';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ─── Reusable toggle ────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-red-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-bold text-gray-800 text-base">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto pb-8">{children}</div>
    </div>
  );
}

// ─── Pengaturan ──────────────────────────────────────────────────────────────
function PengaturanModal({ onClose }) {
  const [cfg, setCfg] = useState(() => ({
    suarNotif:   true,
    suaraPanic:  true,
    notifBrowser:Notification.permission === 'granted',
    darkMode:    false,
    ...loadSettings(),
  }));

  function set(key, val) {
    const next = { ...cfg, [key]: val };
    setCfg(next);
    saveSettings(next);
    if (key === 'notifBrowser' && val) {
      Notification.requestPermission();
    }
  }

  const rows = [
    {
      icon: Volume2, label: 'Suara Notifikasi', desc: 'Bunyi saat dipanggil atau ada notif', key: 'suarNotif',
    },
    {
      icon: Bell, label: 'Suara Panic', desc: 'Bunyi konfirmasi saat tekan panic button', key: 'suaraPanic',
    },
    {
      icon: Bell, label: 'Notifikasi Browser', desc: 'Tampilkan notif meski tab tidak aktif', key: 'notifBrowser',
    },
  ];

  return (
    <Modal title="Pengaturan Aplikasi" onClose={onClose}>
      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Suara & Notifikasi</p>
          </div>
          {rows.map((r, i) => (
            <div key={r.key} className={`flex items-center gap-3 px-4 py-3 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <r.icon className="w-[18px] h-[18px] text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-sm font-medium">{r.label}</p>
                <p className="text-gray-400 text-xs">{r.desc}</p>
              </div>
              <Toggle value={cfg[r.key]} onChange={(v) => set(r.key, v)} />
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tampilan</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              {cfg.darkMode ? <Moon className="w-[18px] h-[18px] text-gray-500" /> : <Sun className="w-[18px] h-[18px] text-gray-500" />}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm font-medium">Mode Gelap</p>
              <p className="text-gray-400 text-xs">Tampilan gelap untuk malam hari</p>
            </div>
            <Toggle value={cfg.darkMode} onChange={(v) => set('darkMode', v)} />
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs pt-2">
          Pengaturan tersimpan otomatis di perangkat ini
        </p>
      </div>
    </Modal>
  );
}

// ─── Edit Profil ──────────────────────────────────────────────────────────────
function EditProfilModal({ driver, onClose }) {
  return (
    <Modal title="Informasi Profil" onClose={onClose}>
      <div className="px-4 pt-4 space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-sm">Data profil diambil dari sistem RIFIM. Untuk mengubah nama atau ID, hubungi koordinator bandara Anda.</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          {[
            { label: 'ID Driver (NIK)', value: driver?.nik || driver?.id },
            { label: 'Nama Lengkap',    value: driver?.name },
            { label: 'Cabang',          value: driver?.airportId },
            { label: 'Tipe',            value: driver?.type === 'external' ? 'Driver Mitra' : 'Driver Airport' },
            { label: 'Status',          value: 'Aktif' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-gray-400 text-sm flex-shrink-0">{label}</span>
              <span className="text-gray-800 text-sm font-medium text-right">{value || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Keamanan ─────────────────────────────────────────────────────────────────
function KeamananModal({ onClose }) {
  return (
    <Modal title="Keamanan Akun" onClose={onClose}>
      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
              <Lock className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Akun Anda Aman</p>
              <p className="text-gray-400 text-sm mt-1">Login menggunakan NIK + Nama yang terdaftar di sistem RIFIM. Tidak ada password yang perlu diingat.</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Tips Keamanan</p>
          </div>
          {[
            'Jangan bagikan NIK Anda kepada siapapun',
            'Selalu logout setelah selesai menggunakan aplikasi',
            'Laporkan ke koordinator jika akun disalahgunakan',
            'Gunakan perangkat pribadi, hindari perangkat umum',
          ].map((tip, i, arr) => (
            <div key={i} className={`flex gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Pusat Bantuan ────────────────────────────────────────────────────────────
const FAQ = [
  { q: 'Bagaimana cara masuk antrian?', a: 'Masuk ke halaman Antrian lalu tekan tombol "Masuk Antrian". Pastikan Anda berada di area bandara (dalam geofence).' },
  { q: 'Kenapa saya tidak bisa masuk antrian?', a: 'Pastikan GPS aktif dan Anda berada di dalam area bandara. Jika masih gagal, hubungi koordinator.' },
  { q: 'Apa itu tombol Panic?', a: 'Tombol darurat untuk mengirim sinyal bantuan ke operator. Tekan jika mengalami situasi berbahaya. Cooldown 60 detik.' },
  { q: 'Bagaimana cara mengaktifkan status Online?', a: 'Tekan tombol "Online/Offline" di halaman Beranda atau tombol hijau di pojok layar.' },
  { q: 'Data saya tidak sesuai?', a: 'Data diambil dari sistem RIFIM. Hubungi koordinator bandara untuk pembaruan data.' },
  { q: 'Notifikasi tidak muncul?', a: 'Buka Pengaturan → aktifkan "Notifikasi Browser" dan pastikan browser mengizinkan notifikasi dari situs ini.' },
];

function PusatBantuanModal({ onClose }) {
  const [open, setOpen] = useState(null);
  return (
    <Modal title="Pusat Bantuan" onClose={onClose}>
      <div className="px-4 pt-4 space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Pertanyaan Umum (FAQ)</p>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} className={i < FAQ.length - 1 ? 'border-b border-gray-100' : ''}>
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <p className="text-gray-700 text-sm font-medium">{item.q}</p>
                {open === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-4 pb-3">
                  <p className="text-gray-500 text-sm">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Phone className="w-[18px] h-[18px] text-red-500" />
            </div>
            <div>
              <p className="text-gray-700 text-sm font-medium">Hubungi Koordinator</p>
              <p className="text-gray-400 text-xs">Jika masalah belum teratasi</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Syarat & Ketentuan ───────────────────────────────────────────────────────
function SyaratModal({ onClose }) {
  return (
    <Modal title="Syarat & Ketentuan" onClose={onClose}>
      <div className="px-4 pt-4 space-y-3">
        {[
          { title: '1. Penggunaan Aplikasi', body: 'Aplikasi RADMS Driver hanya diperuntukkan bagi driver resmi yang terdaftar di sistem RIFIM. Penggunaan oleh pihak yang tidak berwenang dilarang.' },
          { title: '2. Data Pribadi', body: 'Data NIK dan nama Anda disimpan untuk keperluan operasional penjemputan penumpang di bandara RIFIM. Data tidak dibagikan kepada pihak ketiga.' },
          { title: '3. Lokasi GPS', body: 'Aplikasi memerlukan akses GPS untuk fitur geofence dan tracking. Lokasi digunakan hanya untuk operasional antrian penjemputan.' },
          { title: '4. Kewajiban Driver', body: 'Driver wajib: menjaga perilaku sopan, mematuhi aturan bandara, tidak memanipulasi sistem antrian, dan melaporkan masalah teknis kepada koordinator.' },
          { title: '5. Panic Button', body: 'Tombol panic hanya digunakan dalam situasi darurat nyata. Penyalahgunaan akan dilaporkan ke koordinator dan dapat berakibat sanksi.' },
          { title: '6. Perubahan Ketentuan', body: 'RIFIM berhak mengubah ketentuan ini sewaktu-waktu. Penggunaan aplikasi berarti Anda menyetujui ketentuan yang berlaku.' },
        ].map((section) => (
          <div key={section.title} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-gray-800 text-sm font-semibold mb-2">{section.title}</p>
            <p className="text-gray-500 text-sm leading-relaxed">{section.body}</p>
          </div>
        ))}
        <p className="text-center text-gray-400 text-xs pb-2">© 2025 PT. RIFIM INTERNATIONAL GEMILANG</p>
      </div>
    </Modal>
  );
}

// ─── Tentang Bandara ──────────────────────────────────────────────────────────
function TentangBandaraModal({ airport, driver, onClose }) {
  return (
    <Modal title="Tentang Bandara" onClose={onClose}>
      <div className="px-4 pt-4 space-y-3">
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-base">{airport?.name || driver?.airportId || '-'}</p>
              <p className="text-red-200 text-xs">Bandara RIFIM</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          {[
            { label: 'Nama Bandara',    value: airport?.name || driver?.airportId || '-' },
            { label: 'Kode Cabang',     value: driver?.airportId || '-' },
            { label: 'Radius Geofence', value: airport?.radius ? `${airport.radius} meter` : '2.000 meter' },
            { label: 'Koordinat',       value: airport?.lat && airport?.lng ? `${airport.lat.toFixed(4)}, ${airport.lng.toFixed(4)}` : '-' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-gray-400 text-sm flex-shrink-0">{label}</span>
              <span className="text-gray-800 text-sm font-medium text-right">{value}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-gray-700 text-sm font-medium mb-1">RIFIM Airport Services</p>
          <p className="text-gray-400 text-sm">PT. RIFIM International Gemilang menyediakan layanan penjemputan dan pengantar penumpang di seluruh bandara jaringan RIFIM.</p>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { driver, logout } = useAuth();
  const { history, airport } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const completedTrips = history.filter((h) => h.status === 'COMPLETED');
  const totalEarnings  = completedTrips.reduce((sum, t) => sum + (t.fare || 0), 0);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const open = (key) => setActiveModal(key);
  const close = () => setActiveModal(null);

  const menuItems = [
    {
      group: 'Akun',
      items: [
        { icon: Edit3,    label: 'Edit Profil',   desc: 'Ubah informasi pribadi',    action: () => open('profil') },
        { icon: Shield,   label: 'Keamanan',       desc: 'Password & verifikasi',     action: () => open('keamanan') },
        { icon: Settings, label: 'Pengaturan',     desc: 'Preferensi aplikasi',       action: () => open('pengaturan') },
      ],
    },
    {
      group: 'Bantuan',
      items: [
        { icon: HelpCircle, label: 'Pusat Bantuan',     desc: 'FAQ & panduan penggunaan',         action: () => open('bantuan') },
        { icon: FileText,   label: 'Syarat & Ketentuan',desc: 'Kebijakan layanan',                action: () => open('syarat') },
        { icon: MapPin,     label: 'Tentang Bandara',   desc: airport?.name || driver?.airportId || 'Bandara RIFIM', action: () => open('bandara') },
      ],
    },
  ];

  const initials = driver?.name
    ? driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DR';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Profil Saya" />

      <div className="px-4 py-4 space-y-4">
        {/* Profile card */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg leading-tight">{driver?.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <CreditCard className="w-3.5 h-3.5 text-red-200" />
                <span className="text-red-100 text-sm font-mono">{driver?.nik || driver?.id || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-red-200" />
                <span className="text-red-100 text-sm truncate">{driver?.airportId || airport?.name || '-'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="text-white font-bold">{driver?.rating ?? '-'}</span>
              </div>
              <p className="text-red-200 text-xs mt-0.5">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{completedTrips.length || '-'}</p>
              <p className="text-red-200 text-xs mt-0.5">Total Trip</p>
            </div>
            <div className="text-center">
              <p className="text-green-300 font-bold text-sm">{totalEarnings > 0 ? `${(totalEarnings / 1000).toFixed(0)}K` : '-'}</p>
              <p className="text-red-200 text-xs mt-0.5">Pendapatan</p>
            </div>
          </div>
        </div>

        {/* Driver ID card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-yellow-500" />
            <p className="text-gray-900 font-semibold">Informasi Driver</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'ID Driver (NIK)', value: driver?.nik || driver?.id },
              { label: 'Nama',            value: driver?.name },
              { label: 'Cabang',          value: driver?.airportId || airport?.name },
              { label: 'Status Akun',     value: 'Aktif', green: true },
            ].map(({ label, value, green }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{label}</span>
                <span className={`text-sm font-medium ${green ? 'text-green-600' : 'text-gray-700'}`}>{value || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu groups */}
        {menuItems.map((group) => (
          <div key={group.group} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{group.group}</p>
            </div>
            {group.items.map((item, idx) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${
                  idx < group.items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <item.icon className="text-gray-500" style={{ width: '18px', height: '18px' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700 text-sm font-medium">{item.label}</p>
                  <p className="text-gray-400 text-xs truncate">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        ))}

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-2xl py-4 font-semibold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar dari Akun
        </button>

        <p className="text-center text-gray-300 text-xs pb-2">
          RADMS Driver v1.0.0 &copy; 2025 RIFIM
        </p>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────── */}
      {activeModal === 'pengaturan' && <PengaturanModal    onClose={close} />}
      {activeModal === 'profil'     && <EditProfilModal    driver={driver} onClose={close} />}
      {activeModal === 'keamanan'   && <KeamananModal      onClose={close} />}
      {activeModal === 'bantuan'    && <PusatBantuanModal  onClose={close} />}
      {activeModal === 'syarat'     && <SyaratModal        onClose={close} />}
      {activeModal === 'bandara'    && <TentangBandaraModal airport={airport} driver={driver} onClose={close} />}

      {/* ─── Logout confirm ─────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">Keluar?</h3>
              <p className="text-gray-400 text-sm mt-1">Anda akan keluar dari akun {driver?.name?.split(' ')[0]}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-medium transition-colors">
                Batal
              </button>
              <button onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-bold transition-colors">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

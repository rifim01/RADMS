import { useState } from 'react'
import { User, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../services/authService'
import { AIRPORTS } from '../services/mockData'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '082345678901',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notifSettings, setNotifSettings] = useState({
    queueAlert: true,
    driverOffline: true,
    attendanceReminder: false,
    kpiReport: true,
    systemUpdate: false,
    email: true,
    browser: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    language: 'id',
    timezone: 'Asia/Makassar',
    dateFormat: 'DD/MM/YYYY',
    autoRefresh: '30',
    theme: 'light',
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const airport = user?.airportId ? AIRPORTS.find(a => a.id === user.airportId) : null

  const tabs = [
    { key: 'profile', label: 'Profil', icon: User },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
    { key: 'system', label: 'Sistem', icon: Shield },
  ]

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola profil, notifikasi, dan pengaturan sistem</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm fade-in">
          ✓ Pengaturan berhasil disimpan
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
            {/* User Card */}
            <div className="px-3 py-4 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {user?.avatar}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-blue-600 font-medium">{ROLE_LABELS[user?.role]}</p>
                  {airport && <p className="text-xs text-gray-400 truncate">{airport.code} — {airport.city}</p>}
                </div>
              </div>
            </div>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Informasi Profil</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                      <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input type="email" value={profile.email} readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
                      <input type="text" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan</label>
                      <input type="text" value={ROLE_LABELS[user?.role]} readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Bandara</label>
                      <input type="text" value={airport ? `${airport.name} (${airport.code})` : 'Semua Bandara'} readOnly
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Ubah Password</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Saat Ini</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} value={profile.currentPassword}
                          onChange={e => setProfile(p => ({ ...p, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                      <input type="password" value={profile.newPassword} onChange={e => setProfile(p => ({ ...p, newPassword: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                      <input type="password" value={profile.confirmPassword} onChange={e => setProfile(p => ({ ...p, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Preferensi Notifikasi</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'queueAlert', label: 'Peringatan Antrian', desc: 'Notifikasi ketika antrian penuh atau ada masalah' },
                      { key: 'driverOffline', label: 'Driver Offline', desc: 'Notifikasi ketika driver aktif tiba-tiba offline' },
                      { key: 'attendanceReminder', label: 'Pengingat Kehadiran', desc: 'Pengingat untuk check-in dan check-out staf' },
                      { key: 'kpiReport', label: 'Laporan KPI', desc: 'Laporan KPI mingguan dan bulanan' },
                      { key: 'systemUpdate', label: 'Pembaruan Sistem', desc: 'Notifikasi pembaruan dan maintenance sistem' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={notifSettings[item.key]}
                            onChange={e => setNotifSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                            className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors
                            after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Metode Notifikasi</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email', desc: 'Kirim notifikasi ke email terdaftar' },
                      { key: 'browser', label: 'Browser', desc: 'Notifikasi push di browser' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={notifSettings[item.key]}
                            onChange={e => setNotifSettings(s => ({ ...s, [item.key]: e.target.checked }))}
                            className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors
                            after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-800 mb-4">Pengaturan Sistem</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bahasa</label>
                    <select value={systemSettings.language} onChange={e => setSystemSettings(s => ({ ...s, language: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Zona Waktu</label>
                    <select value={systemSettings.timezone} onChange={e => setSystemSettings(s => ({ ...s, timezone: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Asia/Makassar">WITA — Asia/Makassar</option>
                      <option value="Asia/Jakarta">WIB — Asia/Jakarta</option>
                      <option value="Asia/Jayapura">WIT — Asia/Jayapura</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Format Tanggal</label>
                    <select value={systemSettings.dateFormat} onChange={e => setSystemSettings(s => ({ ...s, dateFormat: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Auto Refresh (detik)</label>
                    <select value={systemSettings.autoRefresh} onChange={e => setSystemSettings(s => ({ ...s, autoRefresh: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="10">10 detik</option>
                      <option value="30">30 detik</option>
                      <option value="60">60 detik</option>
                      <option value="0">Nonaktif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema</label>
                    <select value={systemSettings.theme} onChange={e => setSystemSettings(s => ({ ...s, theme: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="light">Terang</option>
                      <option value="dark">Gelap</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Informasi Sistem</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Versi Aplikasi', 'RADMS v1.0.0'],
                      ['Lingkungan', 'Production'],
                      ['Terakhir Login', '10 Juni 2026, 08:00 WITA'],
                      ['Session ID', 'ses_' + Math.random().toString(36).slice(2, 10)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-gray-700 font-mono text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition font-medium"
              >
                <Save className="w-4 h-4" /> Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

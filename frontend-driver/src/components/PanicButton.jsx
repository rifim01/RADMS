import React, { useState } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function PanicButton() {
  const { triggerPanic, panicActive, panicCooldown, location } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const handlePress = () => {
    if (panicCooldown) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setSending(true);
    setShowConfirm(false);
    await triggerPanic();
    setSending(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {/* Full Page Panic Screen */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6 py-8">
        {/* Header Warning */}
        <div className="w-full max-w-sm mb-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm font-medium">Tombol Darurat</p>
            <p className="text-slate-400 text-xs mt-1">
              Gunakan hanya dalam situasi darurat sesungguhnya
            </p>
          </div>
        </div>

        {/* Main Panic Button */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer pulse rings */}
          {!panicCooldown && (
            <>
              <span className="absolute inline-flex w-64 h-64 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="absolute inline-flex w-52 h-52 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            </>
          )}

          {/* Active pulse rings */}
          {panicActive && (
            <>
              <span className="absolute inline-flex w-72 h-72 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '0.8s' }} />
              <span className="absolute inline-flex w-56 h-56 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: '0.6s' }} />
            </>
          )}

          <button
            onClick={handlePress}
            disabled={panicCooldown || sending}
            className={`
              relative z-10 w-44 h-44 rounded-full font-bold text-white
              flex flex-col items-center justify-center gap-2
              shadow-2xl transition-all duration-200 select-none
              ${panicCooldown
                ? 'bg-slate-600 cursor-not-allowed shadow-slate-600/30'
                : panicActive
                  ? 'bg-red-500 scale-110 shadow-red-500/60'
                  : 'bg-red-600 hover:bg-red-500 active:scale-95 shadow-red-600/40 hover:shadow-red-500/50'
              }
            `}
          >
            {panicActive ? (
              <>
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm font-semibold">Mengirim...</span>
              </>
            ) : panicCooldown ? (
              <>
                <AlertTriangle className="w-10 h-10 text-slate-400" />
                <span className="text-sm font-semibold text-slate-400">Cooldown</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-12 h-12" />
                <span className="text-lg font-bold">DARURAT</span>
                <span className="text-xs font-normal opacity-80">Tekan untuk bantuan</span>
              </>
            )}
          </button>
        </div>

        {/* Status text */}
        {panicActive && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-6 py-3 text-center mb-4">
            <p className="text-red-400 font-semibold">Sinyal darurat terkirim!</p>
            <p className="text-slate-400 text-sm mt-1">Tim operator sedang dihubungi</p>
          </div>
        )}

        {panicCooldown && !panicActive && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-6 py-3 text-center mb-4">
            <p className="text-yellow-400 font-semibold">Alert darurat telah dikirim</p>
            <p className="text-slate-400 text-sm mt-1">Tunggu 60 detik sebelum mengirim ulang</p>
          </div>
        )}

        {/* Location info */}
        {location && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">Lokasi GPS Anda</p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Emergency contacts */}
        <div className="w-full max-w-sm mt-8 space-y-3">
          <p className="text-slate-500 text-xs font-medium text-center uppercase tracking-wider mb-2">
            Kontak Darurat
          </p>
          {[
            { name: 'Operator Bandara', number: '(0411) 555-1234', color: 'blue' },
            { name: 'Polisi', number: '110', color: 'indigo' },
            { name: 'Ambulans', number: '119', color: 'green' },
          ].map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              className={`flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 transition-colors hover:bg-slate-700/60`}
            >
              <div className={`w-9 h-9 rounded-lg bg-${contact.color}-500/20 flex items-center justify-center`}>
                <Phone className={`w-4 h-4 text-${contact.color}-400`} />
              </div>
              <div>
                <p className="text-slate-200 text-sm font-medium">{contact.name}</p>
                <p className="text-slate-400 text-xs">{contact.number}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Konfirmasi Darurat</h3>
                <p className="text-slate-400 text-sm">Ini akan mengirim alert ke operator</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-6">
              Apakah Anda yakin ingin mengirim sinyal darurat? Tim operator akan segera dihubungi dan bantuan akan dikirim ke lokasi Anda.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-bold transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Kirim Darurat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

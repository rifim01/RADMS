import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('logo'); // logo -> tagline -> fade

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 800);
    const t2 = setTimeout(() => setPhase('fade'), 2000);
    const t3 = setTimeout(() => onComplete?.(), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-red-950 to-slate-950 transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-red-800/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CC1B1B" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Logo */}
      <div
        className={`relative z-10 flex flex-col items-center transition-all duration-700 ${
          phase === 'logo' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}
      >
        {/* RIFIM Logo: RI box + FIM outside */}
        <div className="relative mb-6">
          <div className="flex items-center gap-0 shadow-2xl shadow-red-900/50">
            {/* Red box with RI */}
            <div className="w-24 h-24 rounded-2xl bg-red-600 flex items-center justify-center">
              <span className="text-white font-black text-5xl" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>RI</span>
            </div>
            {/* FIM outside the box */}
            <span className="text-white font-black text-6xl ml-3" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>FIM</span>
          </div>
          {/* Rotating ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-red-500/30 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -inset-4 rounded-3xl border border-red-500/10 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
        </div>

        {/* Brand subtitle */}
        <p className="text-red-300 text-sm font-medium tracking-widest uppercase">
          Driver Management System
        </p>

        {/* Tagline */}
        <div
          className={`mt-8 text-center transition-all duration-500 ${
            phase === 'tagline' || phase === 'fade'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-slate-400 text-sm">
            PT. RIFIM INTERNATIONAL GEMILANG
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Melayani Dunia, Menggerakkan Negeri
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
            />
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-slate-600 text-xs">v1.0.0 &copy; 2025 RIFIM</p>
      </div>
    </div>
  );
}

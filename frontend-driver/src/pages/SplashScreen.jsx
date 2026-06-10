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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="1"/>
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
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            {/* Airplane SVG */}
            <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>
          {/* Rotating ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-blue-500/30 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -inset-4 rounded-3xl border border-blue-500/10 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-extrabold text-white tracking-wide mb-1">
          RADMS
        </h1>
        <p className="text-blue-400 text-sm font-medium tracking-widest uppercase">
          Driver
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
            RIFIM Airport Driver Management System
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Bandara Sultan Hasanuddin Makassar
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
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

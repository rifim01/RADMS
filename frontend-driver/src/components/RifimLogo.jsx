import React from 'react'

// RIFIM Logo — gabungan elemen terbaik dari semua variasi brand:
// [RI] kotak merah dengan border tebal (kanan bawah),
// FIM bold dengan panah merah ke atas (kiri bawah / kanan bawah),
// shadow + depth (kiri atas), PT. RIFIM INTERNATIONAL GEMILANG
export default function RifimLogo({ className = '', variant = 'dark' }) {
  const isDark = variant === 'dark'
  const fimColor    = isDark ? 'white' : '#CC0000'
  const subtitleCol = isDark ? 'rgba(255,255,255,0.65)' : '#888'
  const arrowColor  = isDark ? '#ff4444' : '#CC0000'

  return (
    <svg viewBox="0 0 310 92" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        {/* Box gradient: bright red top, dark red bottom */}
        <linearGradient id={`rfBg${variant}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FF1111"/>
          <stop offset="50%" stopColor="#CC0000"/>
          <stop offset="100%" stopColor="#880000"/>
        </linearGradient>
        {/* FIM gradient */}
        <linearGradient id={`rfFim${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isDark ? '#ffffff' : '#EE1111'}/>
          <stop offset="100%" stopColor={isDark ? '#cccccc' : '#880000'}/>
        </linearGradient>
        {/* Drop shadow */}
        <filter id={`rfSh${variant}`} x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.55)"/>
        </filter>
        {/* Inner glow for RI text */}
        <filter id={`rfGl${variant}`} x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      {/* ── Outer box border (like bottom-right style) ── */}
      <rect x="1" y="1" width="86" height="86" rx="5" fill="none" stroke="#CC0000" strokeWidth="3"/>

      {/* ── Red filled inner box ── */}
      <rect x="5" y="5" width="78" height="78" rx="3" fill={`url(#rfBg${variant})`} filter={`url(#rfSh${variant})`}/>

      {/* ── Highlight top-left corner (3D depth like kiri-atas) ── */}
      <rect x="5" y="5" width="78" height="12" rx="3" fill="rgba(255,255,255,0.12)"/>
      <rect x="5" y="5" width="10" height="78" rx="3" fill="rgba(255,255,255,0.08)"/>

      {/* ── RI Text ── */}
      <text
        x="44" y="64"
        textAnchor="middle"
        fontFamily="Impact,Arial Black,Arial,sans-serif"
        fontWeight="900"
        fontSize="50"
        fill="white"
        filter={`url(#rfGl${variant})`}
        letterSpacing="-1"
      >RI</text>

      {/* ── Vertical divider ── */}
      <line x1="91" y1="10" x2="91" y2="78" stroke={fimColor} strokeWidth="2.5" opacity="0.35"/>

      {/* ── FIM Text ── */}
      <text
        x="100" y="74"
        fontFamily="Impact,Arial Black,Arial,sans-serif"
        fontWeight="900"
        fontSize="68"
        fill={`url(#rfFim${variant})`}
        filter={`url(#rfSh${variant})`}
        letterSpacing="-1"
      >FIM</text>

      {/* ── Red arrow (panah pertumbuhan dari kiri-bawah & kanan-bawah) ── */}
      <g transform="translate(261,12)" filter={`url(#rfSh${variant})`}>
        <line x1="0" y1="22" x2="22" y2="0" stroke={arrowColor} strokeWidth="3" strokeLinecap="round"/>
        <polygon points="22,0 14,0 22,8" fill={arrowColor}/>
      </g>

      {/* ── Company name ── */}
      <text
        x="2" y="90"
        fontFamily="Arial,Helvetica,sans-serif"
        fontWeight="600"
        fontSize="9"
        fill={subtitleCol}
        letterSpacing="0.6"
      >PT. RIFIM INTERNATIONAL GEMILANG</text>
    </svg>
  )
}

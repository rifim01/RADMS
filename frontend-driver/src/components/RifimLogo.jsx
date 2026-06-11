import React from 'react'

// Bold 3D-style RIFIM logo matching actual brand identity
// [RI red square] FIM bold red — PT. RIFIM INTERNATIONAL GEMILANG
export default function RifimLogo({ className = '', variant = 'dark' }) {
  // variant: 'dark' = logo on dark/red bg (white RI), 'light' = logo on white bg (red RI)
  const boxFill   = '#CC0000'
  const boxFill2  = '#AA0000'
  const rimColor  = variant === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
  const fimColor  = variant === 'dark' ? 'white' : '#CC0000'
  const subColor  = variant === 'dark' ? 'rgba(255,255,255,0.7)' : '#888'

  return (
    <svg viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EE1111"/>
          <stop offset="100%" stopColor="#990000"/>
        </linearGradient>
        <linearGradient id="fimGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={variant === 'dark' ? '#ffffff' : '#DD1111'}/>
          <stop offset="100%" stopColor={variant === 'dark' ? '#dddddd' : '#880000'}/>
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>

      {/* Red square badge */}
      <rect x="2" y="2" width="82" height="82" rx="6" fill="url(#boxGrad)" filter="url(#shadow)"/>
      {/* Inner highlight rim */}
      <rect x="5" y="5" width="76" height="76" rx="4" fill="none" stroke={rimColor} strokeWidth="1.5"/>
      {/* RI text */}
      <text
        x="43" y="64"
        textAnchor="middle"
        fontFamily="Impact,Arial Black,Arial,sans-serif"
        fontWeight="900"
        fontSize="52"
        fill="white"
        filter="url(#shadow)"
      >RI</text>

      {/* Vertical divider line */}
      <line x1="88" y1="8" x2="88" y2="78" stroke={fimColor} strokeWidth="2" opacity="0.4"/>

      {/* FIM text */}
      <text
        x="98" y="72"
        fontFamily="Impact,Arial Black,Arial,sans-serif"
        fontWeight="900"
        fontSize="66"
        fill="url(#fimGrad)"
        filter="url(#shadow)"
      >FIM</text>

      {/* Company name */}
      <text
        x="2" y="87"
        fontFamily="Arial,Helvetica,sans-serif"
        fontWeight="500"
        fontSize="9"
        fill={subColor}
        letterSpacing="0.8"
      >PT. RIFIM INTERNATIONAL GEMILANG</text>
    </svg>
  )
}

import React from 'react'

export default function RifimLogo({ className = '', textColor = '#CC1B1B', subtitleColor = '#666' }) {
  return (
    <svg viewBox="0 0 260 72" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Red square with RI */}
      <rect x="0" y="0" width="72" height="72" rx="8" fill="#CC1B1B"/>
      <text x="36" y="48" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="36" fill="white">RI</text>
      {/* FIM outside box */}
      <text x="82" y="52" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="42" fill={textColor}>FIM</text>
      {/* Company name below */}
      <text x="0" y="66" fontFamily="Arial,sans-serif" fontWeight="400" fontSize="9.5" fill={subtitleColor} letterSpacing="0.5">PT. RIFIM INTERNATIONAL GEMILANG</text>
    </svg>
  )
}

import React from 'react'

export default function RifimLogo({ className = '', variant = 'dark' }) {
  return (
    <img
      src="/rifim-logo.png"
      alt="RIFIM"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}

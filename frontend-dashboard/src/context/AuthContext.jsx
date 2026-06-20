import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const STAFF_DEVICE_KEY = 'radms_staff_device_id'

function getOrCreateStaffDeviceId() {
  let id = localStorage.getItem(STAFF_DEVICE_KEY)
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).substring(2)
    localStorage.setItem(STAFF_DEVICE_KEY, id)
  }
  return id
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = authService.onAuthChange((u) => {
      setUser(u)
      setAuthReady(true)
    })
    // Mark auth ready if no session within 1s
    const timer = setTimeout(() => setAuthReady(true), 1000)
    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    try {
      const u = await authService.login(email, password)
      setUser(u)
      return { success: true, user: u }
    } catch (err) {
      let error = 'Terjadi kesalahan. Coba lagi.'
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        error = 'Email atau password salah.'
      } else if (msg.includes('not found') || msg.includes('user')) {
        error = 'Email tidak terdaftar di sistem.'
      } else if (msg.includes('network') || msg.includes('fetch')) {
        error = 'Gagal terhubung ke server. Periksa koneksi internet.'
      }
      return { success: false, error }
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { ref, update, onValue, off, onDisconnect } from 'firebase/database'
import { db } from '../firebase/config'
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
  const unsubDeviceRef = useRef(null)

  // Clean up device listener
  const stopDeviceListener = useCallback(() => {
    if (unsubDeviceRef.current) {
      unsubDeviceRef.current()
      unsubDeviceRef.current = null
    }
  }, [])

  const logout = useCallback(async () => {
    stopDeviceListener()
    await authService.logout()
    setUser(null)
  }, [stopDeviceListener])

  // Start single-device enforcement for a logged-in user
  const startDeviceSession = useCallback((uid) => {
    stopDeviceListener()
    const deviceId = getOrCreateStaffDeviceId()
    const r = ref(db, `staff_sessions/${uid}/activeDeviceId`)
    // Write this device as the active one
    update(ref(db, `staff_sessions/${uid}`), { activeDeviceId: deviceId }).catch(() => {})
    // Remove on disconnect
    onDisconnect(r).remove()
    // Listen for device takeover
    onValue(r, (snap) => {
      const val = snap.val()
      if (val && val !== deviceId) {
        sessionStorage.setItem('radms_staff_kicked', '1')
        logout()
      }
    })
    unsubDeviceRef.current = () => off(r)
  }, [stopDeviceListener, logout])

  useEffect(() => {
    const unsub = authService.onAuthChange((u) => {
      setUser(u)
      setAuthReady(true)
      if (u?.id) {
        startDeviceSession(u.id)
      } else {
        stopDeviceListener()
      }
    })
    return () => {
      unsub()
      stopDeviceListener()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    try {
      const u = await authService.login(email, password)
      setUser(u)
      startDeviceSession(u.id)
      return { success: true, user: u }
    } catch (err) {
      let error = 'Terjadi kesalahan. Coba lagi.'
      const code = err?.code || ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        error = 'Email atau password salah.'
      } else if (code === 'auth/user-not-found') {
        error = 'Email tidak terdaftar di sistem.'
      } else if (code === 'auth/network-request-failed') {
        error = 'Gagal terhubung ke server. Periksa koneksi internet.'
      }
      return { success: false, error }
    }
  }, [startDeviceSession])

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

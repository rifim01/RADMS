import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const unsub = authService.onAuthChange((u) => {
      setUser(u)
      setAuthReady(true)
    })
    return unsub
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const u = await authService.login(email, password)
      setUser(u)
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

import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import SplashScreen from './pages/SplashScreen.jsx'
import LoginPage from './pages/LoginPage.jsx'
import HomePage from './pages/HomePage.jsx'
import QueuePage from './pages/QueuePage.jsx'
import MapPage from './pages/MapPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import PanicButton from './components/PanicButton.jsx'
import BottomNav from './components/BottomNav.jsx'
import Header from './components/Header.jsx'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public route wrapper (redirect to home if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return children
}

// Layout wrapper with bottom nav
function AppLayout({ children, title, showBack = false }) {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
      <BottomNav />
    </div>
  )
}

// Panic page wrapper (special layout)
function PanicPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header title="Tombol Darurat" showBack={true} />
      <PanicButton />
      <BottomNav />
    </div>
  )
}

// Main app with routing
function AppRoutes() {
  const location = useLocation()

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HomePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <AppLayout>
              <QueuePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MapPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/panic"
        element={
          <ProtectedRoute>
            <PanicPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

// Root app with splash screen and providers
export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  // Check if first load or returning user
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('radms_splash_seen')
    if (hasSeenSplash) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem('radms_splash_seen', '1')
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

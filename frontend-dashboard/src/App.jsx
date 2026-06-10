import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ROLE_REDIRECTS } from './services/authService'

// Layout
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import NationalDashboard from './pages/NationalDashboard'
import AirportDashboard from './pages/AirportDashboard'
import DriverTrackingPage from './pages/DriverTrackingPage'
import QueueManagementPage from './pages/QueueManagementPage'
import AttendancePage from './pages/AttendancePage'
import KPIAnalyticsPage from './pages/KPIAnalyticsPage'
import ReportingPage from './pages/ReportingPage'
import DriversPage from './pages/DriversPage'
import StaffPage from './pages/StaffPage'
import AirportsPage from './pages/AirportsPage'
import SettingsPage from './pages/SettingsPage'

function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarCollapsed(true)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header onToggleSidebar={() => setSidebarCollapsed(c => !c)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Routes>
            {/* Default redirect based on role */}
            <Route path="/" element={<Navigate to={ROLE_REDIRECTS[user?.role] || '/login'} replace />} />

            <Route path="/national-dashboard" element={
              <ProtectedRoute permission="national_dashboard">
                <NationalDashboard />
              </ProtectedRoute>
            } />
            <Route path="/airport-dashboard" element={
              <ProtectedRoute permission="airport_dashboard">
                <AirportDashboard />
              </ProtectedRoute>
            } />
            <Route path="/driver-tracking" element={
              <ProtectedRoute permission="drivers">
                <DriverTrackingPage />
              </ProtectedRoute>
            } />
            <Route path="/queue" element={
              <ProtectedRoute permission="queue">
                <QueueManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute permission="attendance">
                <AttendancePage />
              </ProtectedRoute>
            } />
            <Route path="/kpi" element={
              <ProtectedRoute permission="kpi">
                <KPIAnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/reporting" element={
              <ProtectedRoute permission="reporting">
                <ReportingPage />
              </ProtectedRoute>
            } />
            <Route path="/drivers" element={
              <ProtectedRoute permission="drivers">
                <DriversPage />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute permission="staff">
                <StaffPage />
              </ProtectedRoute>
            } />
            <Route path="/airports" element={
              <ProtectedRoute permission="airports">
                <AirportsPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute permission="settings">
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          isAuthenticated
            ? <DashboardLayout />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

import { supabase } from '../supabase/config'
import { fetchUsers, fetchStaff } from './sheetsService'

// Role-based redirect paths after login
export const ROLE_REDIRECTS = {
      super_admin:  '/national-dashboard',
      coordinator:  '/airport-dashboard',
      staff:        '/airport-dashboard',
}

// Human-readable role labels for display in Header/Settings
export const ROLE_LABELS = {
      super_admin: 'Super Admin',
      coordinator: 'Koordinator Bandara',
      staff:       'Staf',
}

// Permission keys per role — must mirror NAV_ITEMS in components/Sidebar.jsx
// and the permission props on routes in App.jsx
export const ROLE_PERMISSIONS = {
      super_admin: ['national_dashboard', 'airport_dashboard', 'drivers', 'queue', 'trips_history', 'attendance', 'kpi', 'reporting', 'staff', 'airports', 'settings'],
      coordinator: ['airport_dashboard', 'drivers', 'queue', 'trips_history', 'attendance', 'kpi', 'reporting', 'settings'],
      staff:       ['airport_dashboard', 'drivers', 'queue', 'trips_history', 'attendance', 'settings'],
}

// Static role mapping for known admin accounts
const STATIC_ROLES = {
      'admin@radms.id':        { role: 'super_admin', name: 'Super Admin RIFIM', airportId: null, avatar: 'SA' },
      'super@rifim.com':       { role: 'super_admin', name: 'Super Admin RIFIM', airportId: null, avatar: 'SA' },
      'rifim01@adminrifim.org':{ role: 'super_admin', name: 'Admin RIFIM',       airportId: null, avatar: 'AR' },
      'pipin@adminrifim.org':  { role: 'super_admin', name: 'Govinda',           airportId: null, avatar: 'GV' },
}

// Convert jabatan from USERS sheet to internal role
function jabatanToRole(jabatan) {
      const j = (jabatan || '').toUpperCase()
      if (j === 'ADMIN')        return 'super_admin'
      if (j === 'KOORDINATOR')  return 'coordinator'
      return 'staff'
}

async function getRoleData(email) {
      const lower = email.toLowerCase()
      if (STATIC_ROLES[lower]) return STATIC_ROLES[lower]

  // Try to fetch role from USERS sheet (ABSENSI)
  try {
          const users = await fetchUsers()
          const found = users.find(u => (u.email || '').toLowerCase() === lower)
          if (found) {
                    return {
                                role: jabatanToRole(found.jabatan),
                                name: found.nama || found.name || lower,
                                airportId: found.airportId || found.airport_id || null,
                                avatar: (found.nama || found.name || 'U').substring(0, 2).toUpperCase(),
                    }
          }
  } catch (e) {
          console.warn('fetchUsers failed, trying fetchStaff', e)
  }

  // Fallback: fetch from STAFF sheet
  try {
          const staff = await fetchStaff()
          const found = staff.find(s => (s.email || '').toLowerCase() === lower)
          if (found) {
                    return {
                                role: jabatanToRole(found.jabatan),
                                name: found.nama || found.name || lower,
                                airportId: found.airportId || found.airport_id || null,
                                avatar: (found.nama || found.name || 'U').substring(0, 2).toUpperCase(),
                    }
          }
  } catch (e) {
          console.warn('fetchStaff also failed', e)
  }

  return { role: 'staff', name: lower, airportId: null, avatar: 'U' }
}

export async function login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const roleData = await getRoleData(email)
      return {
              uid: data.user.id,
              email: data.user.email,
              ...roleData,
      }
}

export async function logout() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
}

/**
 * Ubah password user yang sedang login.
 * Verifikasi currentPassword dulu (re-auth) sebelum benar-benar mengubah,
 * supaya field "Password Saat Ini" di UI bukan cuma hiasan.
 */
export async function changePassword(email, currentPassword, newPassword) {
      if (!currentPassword) throw new Error('Password saat ini wajib diisi.')
      if (!newPassword || newPassword.length < 6) throw new Error('Password baru minimal 6 karakter.')

      // Verifikasi password saat ini benar
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
      if (verifyError) throw new Error('Password saat ini salah.')

      // Update ke password baru
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw new Error(updateError.message || 'Gagal mengubah password.')
}

export function getCurrentUser() {
      return null // Will be set via onAuthChange
}

export function isAuthenticated() {
            return supabase.auth.getSession().then(({ data }) => !!data.session)
}

export function onAuthChange(callback) {
      // First, resolve current session immediately
  supabase.auth.getSession().then(async ({ data }) => {
          if (data.session) {
                    const email = data.session.user.email
                    const roleData = await getRoleData(email)
                    callback({ uid: data.session.user.id, email, ...roleData })
          } else {
                    callback(null)
          }
  })

  // Then listen for future changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
                    const email = session.user.email
                    const roleData = await getRoleData(email)
                    callback({ uid: session.user.id, email, ...roleData })
          } else {
                    callback(null)
          }
  })
      return () => subscription.unsubscribe()
}

export const authService = { login, logout, getCurrentUser, isAuthenticated, onAuthChange, changePassword }

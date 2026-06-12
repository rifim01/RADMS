import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { fetchUsers, fetchStaff } from './sheetsService'

// Static role mapping for known admin accounts
const STATIC_ROLES = {
  'admin@radms.id':           { role: 'super_admin', name: 'Super Admin RIFIM', airportId: null, avatar: 'SA' },
  'super@rifim.com':          { role: 'super_admin', name: 'Super Admin RIFIM', airportId: null, avatar: 'SA' },
  'rifim01@adminrifim.org':   { role: 'super_admin', name: 'Admin RIFIM',       airportId: null, avatar: 'AR' },
  'pipin@adminrifim.org':     { role: 'super_admin', name: 'Govinda',           airportId: null, avatar: 'GV' },
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
    const found = users.find(u => u.email === lower)
    if (found) {
      return {
        role:      jabatanToRole(found.jabatan),
        name:      found.nama || email,
        airportId: found.cabang || null,
        jabatan:   found.jabatan,
        avatar:    (found.nama || email).slice(0, 2).toUpperCase(),
      }
    }
  } catch { /* ignore */ }

  // Try MASTER DATA STAFF sheet by email
  try {
    const staff = await fetchStaff()
    const found = staff.find(s => s.email && s.email.toLowerCase() === lower)
    if (found) {
      return {
        role:      jabatanToRole(found.role),
        name:      found.name || email,
        airportId: found.airportId || null,
        avatar:    (found.name || email).slice(0, 2).toUpperCase(),
      }
    }
  } catch { /* ignore */ }

  // Fallback
  return { role: 'staff', name: email, airportId: null, avatar: email.slice(0, 2).toUpperCase() }
}

export const authService = {
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    const roleData = await getRoleData(cred.user.email)
    const userData = {
      id:        cred.user.uid,
      email:     cred.user.email,
      ...roleData,
    }
    localStorage.setItem('radms_user', JSON.stringify(userData))
    return userData
  },

  async logout() {
    await signOut(auth)
    localStorage.removeItem('radms_user')
  },

  getCurrentUser() {
    const stored = localStorage.getItem('radms_user')
    return stored ? JSON.parse(stored) : null
  },

  isAuthenticated() {
    return !!this.getCurrentUser()
  },

  onAuthChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const stored = localStorage.getItem('radms_user')
        let userData = stored ? JSON.parse(stored) : null
        if (!userData || userData.email !== firebaseUser.email) {
          const roleData = await getRoleData(firebaseUser.email)
          userData = { id: firebaseUser.uid, email: firebaseUser.email, ...roleData }
          localStorage.setItem('radms_user', JSON.stringify(userData))
        }
        callback(userData)
      } else {
        localStorage.removeItem('radms_user')
        callback(null)
      }
    })
  },
}

export const ROLE_REDIRECTS = {
  super_admin:  '/national-dashboard',
  coordinator:  '/airport-dashboard',
  staff:        '/queue',
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  coordinator: 'Airport Coordinator',
  staff:       'Staff',
}

export const ROLE_PERMISSIONS = {
  super_admin:  ['national_dashboard', 'airport_dashboard', 'drivers', 'queue', 'attendance', 'kpi', 'reporting', 'staff', 'airports', 'settings', 'trips_history'],
  coordinator:  ['airport_dashboard', 'drivers', 'queue', 'attendance', 'kpi', 'reporting', 'settings', 'trips_history'],
  staff:        ['queue', 'drivers', 'attendance', 'settings', 'trips_history'],
}

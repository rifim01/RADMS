import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

// Role mapping by email — extend this list as needed
const EMAIL_ROLES = {
  'admin@radms.id':       { role: 'super_admin',  name: 'Super Admin RIFIM',     airportId: null,                          avatar: 'SA' },
  'super@rifim.com':      { role: 'super_admin',  name: 'Super Admin RIFIM',     airportId: null,                          avatar: 'SA' },
  'rifim01@adminrifim.org': { role: 'super_admin', name: 'Admin RIFIM',           airportId: null,                          avatar: 'AR' },
}

function getRoleData(email) {
  const lower = email.toLowerCase()
  if (EMAIL_ROLES[lower]) return EMAIL_ROLES[lower]
  // Default fallback based on email pattern
  if (lower.includes('coord')) return { role: 'coordinator', name: email, airportId: null, avatar: 'CO' }
  if (lower.includes('staff')) return { role: 'staff',       name: email, airportId: null, avatar: 'ST' }
  return { role: 'super_admin', name: email, airportId: null, avatar: email.slice(0,2).toUpperCase() }
}

export const authService = {
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    const roleData = getRoleData(cred.user.email)
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
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const stored = localStorage.getItem('radms_user')
        const userData = stored ? JSON.parse(stored) : {
          id:    firebaseUser.uid,
          email: firebaseUser.email,
          ...getRoleData(firebaseUser.email),
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
  super_admin:  ['national_dashboard', 'airport_dashboard', 'drivers', 'queue', 'attendance', 'kpi', 'reporting', 'staff', 'airports', 'settings'],
  coordinator:  ['airport_dashboard', 'drivers', 'queue', 'attendance', 'kpi', 'reporting', 'settings'],
  staff:        ['queue', 'drivers', 'attendance', 'settings'],
}

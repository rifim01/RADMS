// ============================================================
// AUTH SERVICE - Mock authentication with localStorage
// ============================================================

const USERS = [
  {
    id: 'usr-001',
    email: 'super@rifim.com',
    password: 'admin123',
    name: 'Super Admin RIFIM',
    role: 'super_admin',
    airportId: null,
    avatar: 'SA',
  },
  {
    id: 'usr-002',
    email: 'coord@rifim.com',
    password: 'coord123',
    name: 'Koordinator Makassar',
    role: 'coordinator',
    airportId: 'apt-1',
    avatar: 'KM',
  },
  {
    id: 'usr-003',
    email: 'staff@rifim.com',
    password: 'staff123',
    name: 'Staff Makassar',
    role: 'staff',
    airportId: 'apt-1',
    avatar: 'SM',
  },
]

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  coordinator: 'Airport Coordinator',
  staff: 'Staff',
}

export const authService = {
  login(email, password) {
    const user = USERS.find(u => u.email === email && u.password === password)
    if (!user) {
      throw new Error('Email atau password salah')
    }
    const { password: _pw, ...safeUser } = user
    localStorage.setItem('radms_user', JSON.stringify(safeUser))
    return safeUser
  },

  logout() {
    localStorage.removeItem('radms_user')
  },

  getCurrentUser() {
    const stored = localStorage.getItem('radms_user')
    return stored ? JSON.parse(stored) : null
  },

  isAuthenticated() {
    return !!this.getCurrentUser()
  },
}

export const ROLE_REDIRECTS = {
  super_admin: '/national-dashboard',
  coordinator: '/airport-dashboard',
  staff: '/queue',
}

export const ROLE_PERMISSIONS = {
  super_admin: ['national_dashboard', 'airport_dashboard', 'drivers', 'queue', 'attendance', 'kpi', 'reporting', 'staff', 'airports', 'settings'],
  coordinator: ['airport_dashboard', 'drivers', 'queue', 'attendance', 'kpi', 'reporting', 'settings'],
  staff: ['queue', 'drivers', 'attendance', 'settings'],
}

import { supabase } from '../supabase/config'
import { fetchUsers, fetchStaff } from './sheetsService'

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

export function getCurrentUser() {
    // Returns cached session synchronously
      return supabase.auth.getSession().then(({ data }) => {
                                       if (!data.session) return null
            const email = data.session.user.email
            const lower = email.toLowerCase()
            if (STATIC_ROLES[lower]) {
                    return { uid: data.session.user.id, email, ...STATIC_ROLES[lower] }
            }
            return { uid: data.session.user.id, email, role: 'staff', name: email, airportId: null, avatar: 'U' }
      })
              }

export function isAuthenticated() {
    return supabase.auth.getSession().then(({ data }) => !!data.session)
}

export function onAuthChange(callback) {
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

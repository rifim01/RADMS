import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_PERMISSIONS } from '../services/authService'

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (permission) {
    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes(permission)) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
            <p className="text-gray-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </div>
        </div>
      )
    }
  }

  return children
}

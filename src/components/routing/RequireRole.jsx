/**
 * Guards admin routes by Firebase auth state and custom role claims.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function RequireRole({ allowedRoles, children }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin/login" replace state={{ denied: true }} />
  }
  return children
}

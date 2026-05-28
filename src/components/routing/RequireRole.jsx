/**
 * Guards routes by Firebase auth state and custom role claims.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getLoginRoute, getDefaultRoute } from '../../utils/roleBasedRoutes'

export default function RequireRole({ allowedRoles, children }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  // Block ALL redirects while auth state is loading
  if (loading) {
    return null
  }
  
  // Block redirects if user exists but role is still undefined (loading state)
  if (user && !role) {
    return null
  }
  
  if (!user) {
    const loginRoute = getLoginRoute(location.pathname)
    return <Navigate to={loginRoute} state={{ from: location.pathname }} />
  }
  
  if (!allowedRoles.includes(role)) {
    // Redirect unauthorized users to their proper default route
    const defaultRoute = getDefaultRoute(role)
    if (defaultRoute && defaultRoute !== location.pathname) {
      return <Navigate to={defaultRoute} state={{ denied: true }} />
    }
    // Fallback to login if no suitable default route
    const loginRoute = getLoginRoute(location.pathname)
    return <Navigate to={loginRoute} state={{ denied: true }} />
  }
  return children
}

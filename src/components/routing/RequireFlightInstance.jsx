import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../context/useSession'
import { getDefaultRoute } from '../../utils/roleBasedRoutes'

/**
 * Dashboard requires a crew/admin flight session (`access_code`), not passenger context.
 */
export default function RequireFlightInstance({ children }) {
  const { sessionId, sessionRole, loading } = useSession()
  const location = useLocation()

  // Block ALL redirects while session state is loading
  if (loading) {
    return null
  }
  
  // Block redirects if sessionRole is undefined (loading state)
  if (sessionId && !sessionRole) {
    return null
  }

  const passengerOnly = sessionRole === 'passenger'
  const crewOk =
    sessionId && (sessionRole === 'crew' || sessionRole === 'admin')

  if (!crewOk || passengerOnly) {
    // Redirect to appropriate session join page based on role
    if (sessionRole === 'crew') {
      return <Navigate to="/crew/session-join" state={{ from: location.pathname }} />
    } else if (sessionRole === 'admin') {
      return <Navigate to="/admin/select-session" state={{ from: location.pathname }} />
    } else {
      // Default fallback for passengers or unknown roles
      return <Navigate to="/" state={{ from: location.pathname }} />
    }
  }
  return children
}

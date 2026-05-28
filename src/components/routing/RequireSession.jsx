/**
 * Passenger menu routes: require flight_instance_id and seat.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../context/useSession'
import { getDefaultRoute } from '../../utils/roleBasedRoutes'

export default function RequireSession({ children }) {
  const { sessionId, seatNumber, sessionRole, loading } = useSession()
  const location = useLocation()

  // Block ALL redirects while session state is loading
  if (loading) {
    return null
  }
  
  // Block redirects if sessionRole is undefined (loading state)
  if (sessionId && !sessionRole) {
    return null
  }

  if (!sessionId) {
    return <Navigate to="/" state={{ from: location.pathname }} />
  }

  const isCrew = sessionRole === 'crew' || sessionRole === 'admin'
  if (isCrew) {
    // Redirect crew to their proper default route instead of hardcoded /admin
    const defaultRoute = getDefaultRoute(sessionRole)
    return <Navigate to={defaultRoute} />
  }

  if (!seatNumber?.trim()) {
    return <Navigate to="/" state={{ from: location.pathname }} />
  }
  return children
}

/**
 * Passenger menu routes: require flight_instance_id and seat.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../context/useSession'

export default function RequireSession({ children }) {
  const { sessionId, seatNumber, sessionRole } = useSession()
  const location = useLocation()

  if (!sessionId) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  const isCrew = sessionRole === 'crew' || sessionRole === 'admin'
  if (isCrew) {
    return <Navigate to="/admin" replace />
  }

  if (!seatNumber?.trim()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}

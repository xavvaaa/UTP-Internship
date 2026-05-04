import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../context/useSession'

/**
 * Dashboard requires a crew/admin flight session (`access_code`), not passenger context.
 */
export default function RequireFlightInstance({ children }) {
  const { sessionId, sessionRole } = useSession()
  const location = useLocation()

  const passengerOnly = sessionRole === 'passenger'
  const crewOk =
    sessionId && (sessionRole === 'crew' || sessionRole === 'admin')

  if (!crewOk || passengerOnly) {
    return <Navigate to="/admin/join-session" replace state={{ from: location.pathname }} />
  }

  return children
}

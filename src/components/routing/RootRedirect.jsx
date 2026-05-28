/**
 * Passenger home (/): only forward guests who already joined a flight.
 * Admin/crew Firebase sign-in must not override the passenger entry page.
 */
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../../context/useSession'

export default function RootRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, seatNumber, sessionRole, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (location.pathname !== '/') return
    if (sessionLoading) return

    const isPassenger =
      sessionRole === 'passenger' && sessionId && seatNumber?.trim()
    if (isPassenger) {
      navigate('/menu', { replace: true })
    }
  }, [location.pathname, sessionId, seatNumber, sessionRole, sessionLoading, navigate])

  return null
}

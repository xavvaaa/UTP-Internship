import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useSession } from '../../context/useSession'
import RequireFlightInstance from './RequireFlightInstance'
import AdminDashboardPage from '../../pages/AdminDashboardPage'
import AdminJoinSessionPage from '../../pages/AdminJoinSessionPage'

export default function AdminRouteHandler() {
  const { role } = useAuth()
  const { sessionId } = useSession()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  // Admins get direct access, crew need session
  if (role === 'admin') {
    return <AdminDashboardPage />
  }

  // Crew need to join a session first
  if (role === 'crew') {
    if (sessionId) {
      return (
        <RequireFlightInstance>
          <AdminDashboardPage />
        </RequireFlightInstance>
      )
    } else {
      return <AdminJoinSessionPage />
    }
  }

  // Fallback - should not reach here due to RequireRole
  return <div>Loading...</div>
}

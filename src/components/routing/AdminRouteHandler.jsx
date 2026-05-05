import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useSession } from '../../context/useSession'
import RequireFlightInstance from './RequireFlightInstance'
import AdminDashboardPage from '../../pages/AdminDashboardPage'
import AdminJoinSessionPage from '../../pages/AdminJoinSessionPage'
import AdminSessionSelectionPage from '../../pages/AdminSessionSelectionPage'

export default function AdminRouteHandler() {
  const { role, loading: authLoading } = useAuth()
  const { sessionId, activeSessionId, loading: sessionLoading } = useSession()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  // Block ALL redirects while auth state is loading
  if (authLoading) {
    return <div>Loading...</div>
  }
  
  // Block redirects if role is undefined (loading state)
  if (!role) {
    return <div>Loading...</div>
  }

  // Admins need to select a session first
  if (role === 'admin') {
    if (!activeSessionId) {
      navigate('/admin/select-session')
      return <div>Loading...</div>
    }
    return <AdminDashboardPage />
  }

  // Crew should never access admin routes - redirect to crew session join
  if (role === 'crew') {
    navigate('/crew/session-join')
    return <div>Redirecting to crew dashboard...</div>
  }

  // Fallback - should not reach here due to RequireRole
  return <div>Loading...</div>
}

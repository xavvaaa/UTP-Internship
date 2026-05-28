import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useSession } from '../../context/useSession'
import AdminDashboardPage from '../../pages/AdminDashboardPage'

export default function AdminRouteHandler() {
  const { role, loading: authLoading } = useAuth()
  const { activeSessionId } = useSession()

  if (authLoading || !role) {
    return <div>Loading...</div>
  }

  if (role === 'admin') {
    if (!activeSessionId) {
      return <Navigate to="/admin/select-session" replace />
    }
    return <AdminDashboardPage />
  }

  if (role === 'crew') {
    return <Navigate to="/crew/session-join" replace />
  }

  return <div>Loading...</div>
}

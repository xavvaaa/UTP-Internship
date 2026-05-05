/**
 * Root redirect component that handles role-based navigation from the root path
 */
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getDefaultRoute } from '../../utils/roleBasedRoutes'

export default function RootRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    // Only redirect from root path, not on every render
    if (location.pathname === '/') {
      // Block ALL redirects while auth state is loading
      if (loading) {
        return
      }
      
      // Block redirects if user exists but role is still undefined (loading state)
      if (user && !role) {
        return
      }
      
      // If user is authenticated and role is defined, redirect to their role-based default route
      if (user && role) {
        const defaultRoute = getDefaultRoute(role)
        if (defaultRoute && defaultRoute !== '/') {
          navigate(defaultRoute)
        }
      }
      // If not authenticated, stay at root (SessionEntryPage)
    }
  }, [location.pathname, user, role, loading, navigate])

  // This component doesn't render anything, it just handles redirects
  return null
}

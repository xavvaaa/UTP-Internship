/**
 * Role-based routing utilities for proper navigation based on user roles
 */

/**
 * Get the default route for a user based on their role
 * @param {string} role - User role ('admin', 'crew', 'passenger', or null)
 * @returns {string} Default route for the role
 */
export function getDefaultRoute(role) {
  switch (role) {
    case 'admin':
      return '/admin/select-session'
    case 'crew':
      return '/crew/session-join'
    case 'passenger':
      return '/menu'
    default:
      return '/login'
  }
}

/**
 * Get the appropriate login route based on the intended destination
 * @param {string} fromPath - The path the user was trying to access
 * @returns {string} Login route to redirect to
 */
export function getLoginRoute(fromPath) {
  // If trying to access admin routes, go to admin login
  if (fromPath?.startsWith('/admin')) {
    return '/admin-login'
  }
  
  // If trying to access crew routes, go to crew login
  if (fromPath?.startsWith('/crew') || fromPath?.startsWith('/cabin-crew')) {
    return '/cabin-crew-login'
  }
  
  // Default to admin login for backwards compatibility
  return '/admin-login'
}

/**
 * Check if a route is accessible by a role
 * @param {string} role - User role
 * @param {string} path - Route path
 * @returns {boolean} Whether the route is accessible
 */
export function isRouteAccessible(role, path) {
  if (!role) return false
  
  // Admin routes
  if (path.startsWith('/admin')) {
    return role === 'admin'
  }
  
  // Crew routes  
  if (path.startsWith('/crew') || path.startsWith('/cabin-crew')) {
    return role === 'crew'
  }
  
  // Passenger routes
  if (path.startsWith('/menu')) {
    return role === 'passenger'
  }
  
  // Public routes (login, session entry, etc.)
  const publicRoutes = ['/', '/join', '/manual-entry', '/admin-login', '/cabin-crew-login']
  return publicRoutes.includes(path) || publicRoutes.some(route => path.startsWith(route))
}

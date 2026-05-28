/**
 * Modern sidebar navigation for airline cabin crew admin dashboard
 */
import { useState, useEffect } from 'react'
import { 
  ClipboardList, 
  MapPin, 
  Utensils, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Plane
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useSession } from '../../context/useSession'
import styles from './SidebarNavigation.module.css'

const NAVIGATION_ITEMS = [
  {
    id: 'orders',
    label: 'Orders',
    icon: ClipboardList,
    description: 'Manage passenger orders'
  },
  {
    id: 'seatmap',
    label: 'Seat Map',
    icon: MapPin,
    description: 'View aircraft seating'
  },
  {
    id: 'menu',
    label: 'Menu Management',
    icon: Utensils,
    description: 'Manage menu items'
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: Users,
    description: 'Manage user sessions'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    description: 'View reports and analytics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'System settings'
  }
]

export default function SidebarNavigation({ activeTab, onTabChange, flightId, canAccessTab }) {
  const { signOut, role } = useAuth()
  const { clearSession } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Update body data attribute when sidebar state changes
  useEffect(() => {
    document.body.setAttribute('data-sidebar-collapsed', isCollapsed.toString())
    return () => {
      document.body.removeAttribute('data-sidebar-collapsed')
    }
  }, [isCollapsed])

  function tabAllowed(tab) {
    return typeof canAccessTab === 'function' ? canAccessTab(tab) : true
  }

  function handleTabClick(tabId) {
    if (tabAllowed(tabId)) {
      onTabChange(tabId)
      setIsMobileOpen(false) // Close mobile menu after selection
    }
  }

  function handleSignOut() {
    clearSession()
    signOut()
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <Plane size={28} className={styles.logoIcon} />
            {!isCollapsed && (
              <div className={styles.logoText}>
                <h2 className={styles.logoTitle}>IFMOD</h2>
                <p className={styles.logoSubtitle}>Cabin Crew</p>
              </div>
            )}
          </div>
          <button
            className={styles.collapseToggle}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Flight Info */}
        {!isCollapsed && (
          <div className={styles.flightInfo}>
            <div className={styles.flightBadge}>
              <span className={styles.flightLabel}>Flight</span>
              <span className={styles.flightNumber}>{flightId || 'N/A'}</span>
            </div>
            <div className={styles.roleBadge}>
              <span className={styles.roleLabel}>Role</span>
              <span className={styles.roleValue}>{role || 'Guest'}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {NAVIGATION_ITEMS.filter(item => tabAllowed(item.id)).map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <li key={item.id} className={styles.navItem}>
                  <button
                    className={`${styles.navButton} ${isActive ? styles.active : ''}`}
                    onClick={() => handleTabClick(item.id)}
                    title={isCollapsed ? item.label : item.description}
                  >
                    <Icon size={20} className={styles.navIcon} />
                    <div className={styles.navContent}>
                      <span className={styles.navLabel}>{item.label}</span>
                      <span className={styles.navDescription}>{item.description}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.signOutButton}
            onClick={handleSignOut}
            title={isCollapsed ? 'Sign out' : 'Sign out of your account'}
          >
            <LogOut size={20} className={styles.signOutIcon} />
            <span className={styles.signOutText}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

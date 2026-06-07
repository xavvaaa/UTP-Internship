/**
 * Cabin crew dashboard with sidebar navigation for operations, inventory, and reports.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import AdminLayout from '../components/layout/AdminLayout'
import SidebarNavigation from '../components/layout/SidebarNavigation'
import { useAuth } from '../context/useAuth'
import { useSession } from '../context/useSession'
import { useToast } from '../context/useToast'
import { auth, firebaseConfigured } from '../firebase/config'
import { flightIdsEqual } from '../utils/flightId'
import OrdersTab from '../components/admin/OrdersTab'
import SeatMapTab from '../components/admin/SeatMapTab'
import MenuManagementTab from '../components/admin/MenuManagementTab'
import ReportsTab from '../components/admin/ReportsTab'
import SettingsTab from '../components/admin/SettingsTab'
import SessionsTab from '../components/admin/SessionsTab'
import { advanceOrderStatus, setOrderStatus, sortOrders, subscribeOrders } from '../services/admin/ordersAdminService'
import {
  createMenuMeal,
  deleteMenuMeal,
  subscribeMenu,
  updateMenuMeal,
} from '../services/admin/menuAdminService'
import { uploadMenuItemImage } from '../services/storageService'
import styles from './AdminDashboardPage.module.css'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, flightId } = useAuth()
  const { sessionId: flightInstanceId, flightNumber, activeSessionId, sessionData } = useSession()
  const { showSuccess, showError } = useToast()

  const isAssignedToActiveFlight =
    Boolean(flightId) && Boolean(flightInstanceId) && flightIdsEqual(flightId, flightInstanceId)

  const isAdminForActiveFlight =
    role === 'admin' &&
    Boolean(flightId) &&
    Boolean(flightInstanceId) &&
    flightIdsEqual(flightId, flightInstanceId)

  const hasActiveSession = Boolean(activeSessionId)
  const canManageSessions = role === 'admin' || hasActiveSession
  const dashboardRoute = role === 'crew' ? '/crew/dashboard' : '/admin'

  const [activeTab, setActiveTab] = useState('orders')

  // Validate URL parameters and redirect if accessing restricted tab
  useEffect(() => {
    document.title = 'IFMOD | Dashboard'
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabParam = urlParams.get('tab')
    
    if (tabParam && tabAllowed(tabParam)) {
      setActiveTab(tabParam)
    } else if (tabParam && !tabAllowed(tabParam)) {
      // Redirect to allowed tab if trying to access restricted tab via URL
      const defaultTab = role === 'admin' ? 'orders' : (isAssignedToActiveFlight ? 'orders' : null)
      if (defaultTab) {
        setActiveTab(defaultTab)
        navigate(`${dashboardRoute}?tab=${defaultTab}`)
      }
    }
  }, [location.search, role, isAssignedToActiveFlight, navigate, dashboardRoute])

  // Handle tab changes with URL synchronization
  const handleTabChange = (tabId) => {
    if (tabAllowed(tabId)) {
      setActiveTab(tabId)
      // Update URL parameter when tab changes while staying on the dashboard route.
      navigate(`${dashboardRoute}?tab=${tabId}`)
    }
  }

  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState('seat')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [reportSummary, setReportSummary] = useState(null)

  useEffect(() => {
    if (!firebaseConfigured) {
      showError('Firebase is not configured for admin view.')
      setLoading(false)
      return () => {}
    }
    
    // Admins can access without a session, but need a session for real-time data
    const fid = String(flightInstanceId ?? '').trim()
    if (!fid && role === 'admin') {
      setOrders([])
      setMenuItems([])
      setLoading(false)
      return () => {}
    }
    if (!fid) {
      setOrders([])
      setMenuItems([])
      setLoading(false)
      return () => {}
    }

    const unsubOrders = subscribeOrders(
      (list) => {
        setOrders(list)
        setLoading(false)
      },
      (err) => {
        showError(err?.message || 'Could not subscribe to orders.')
        setLoading(false)
      },
      fid,
    )
    const unsubMenu = subscribeMenu(
      (list) => setMenuItems(list),
      (err) => showError(err?.message || 'Could not subscribe to menu.'),
      fid,
    )
    return () => {
      unsubOrders()
      unsubMenu()
    }
  }, [showError, flightInstanceId])

  const visibleOrders = useMemo(() => sortOrders(orders, sortMode), [orders, sortMode])

  useEffect(() => {
    if (activeTab === 'reports' && isAdminForActiveFlight) {
      loadReport()
    }
  }, [activeTab, isAdminForActiveFlight])

  async function handleAdvance(order) {
    setUpdatingOrderId(order.id)
    try {
      await advanceOrderStatus(order.id, order.status)
    } catch (err) {
      showError(err?.message || 'Could not update order status.')
    } finally {
      setUpdatingOrderId('')
    }
  }

  async function handleSetOrderStatus(order, status) {
    setUpdatingOrderId(order.id)
    try {
      await setOrderStatus(order.id, status)
    } catch (err) {
      showError(err?.message || 'Could not update order status.')
    } finally {
      setUpdatingOrderId('')
    }
  }

  async function handleSaveMenu(id, form) {
    setSavingItem(true)
    try {
      const result = id
        ? await updateMenuMeal(id, form, flightInstanceId)
        : await createMenuMeal(form, flightInstanceId)
      const savedId = id || result?.id
      if (savedId) {
        const stock = Math.max(0, Number(form.stock ?? form.stockCount ?? 0))
        const optimisticItem = {
          ...form,
          id: savedId,
          stock,
          category: 'meal',
          available: stock > 0,
          flightId: String(flightInstanceId ?? ''),
        }
        setMenuItems((prev) => {
          const exists = prev.some((item) => item.id === savedId)
          if (exists) {
            return prev.map((item) => (item.id === savedId ? { ...item, ...optimisticItem } : item))
          }
          return [...prev, optimisticItem].sort((a, b) => String(a.name).localeCompare(String(b.name)))
        })
      }
      showSuccess(id ? 'Menu item updated successfully.' : 'Menu item created successfully.')
    } catch (err) {
      showError(err?.message || 'Could not save menu item.')
    } finally {
      setSavingItem(false)
    }
  }

  async function handleDeleteMenu(id, imageUrl) {
    try {
      await deleteMenuMeal(id, imageUrl)
      setMenuItems((prev) => prev.filter((item) => item.id !== id))
      showSuccess('Menu item deleted successfully.')
    } catch (err) {
      showError(err?.message || 'Could not delete menu item.')
    }
  }

  // Dynamic tab title and subtitle functions
  function getTabTitle(tab) {
    const titles = {
      orders: 'Orders Management',
      seatmap: 'Seat Map',
      menu: 'Menu Management',
      sessions: 'Session Management',
      reports: 'Reports',
      settings: 'Settings'
    }
    return titles[tab] || 'Dashboard'
  }

  function getTabSubtitle(tab, flightNumber) {
    const subtitles = {
      orders: `Manage orders for ${flightNumber || 'N/A'} flight`,
      seatmap: `View seat map for ${flightNumber || 'N/A'} flight`,
      menu: `Manage menu items for ${flightNumber || 'N/A'} flight`,
      sessions: 'Create and manage flight sessions',
      reports: `View reports for ${flightNumber || 'N/A'} flight`,
      settings: 'System and user settings'
    }
    return subtitles[tab] || `${new Date().toLocaleDateString()} ${'\u2022'} Flight ${flightNumber || 'N/A'}`
  }

  function tabAllowed(tab) {
    // Admins can access everything regardless of session assignment
    if (role === 'admin') return true
    // Crew can access orders/seatmap/menu when assigned to flight, settings always available for account management, never sessions or reports
    if (tab === 'menu') return isAssignedToActiveFlight
    if (tab === 'settings') return true // Crew can always access settings for account management
    if (tab === 'sessions') return false
    if (tab === 'reports') return false
    return tab === 'orders' || tab === 'seatmap'
  }

  async function loadReport() {
    try {
      const tokenResult = await auth?.currentUser?.getIdTokenResult(true)
      const token = tokenResult?.token
      const res = await fetch('/api/reports/summary', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setReportSummary(data.summary ?? null)
    } catch {
      setReportSummary(null)
    }
  }

  return (
    <AdminLayout
      sidebar={
        <SidebarNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          flightId={flightNumber || 'N/A'}
          canAccessTab={tabAllowed}
        />
      }
    >
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{getTabTitle(activeTab)}</h1>
          <p className={styles.subtitle}>{getTabSubtitle(activeTab, flightNumber)}</p>
        </div>
      </div>

      {!isAssignedToActiveFlight && role === 'crew' && !flightInstanceId && (
        <div className={styles.statusAlert}>
          <AlertCircle size={18} />
          <span>
            Your Firebase <code>flightId</code> claim must match this flight session. Update crew user
            claims to the flight instance id.
          </span>
        </div>
      )}

      {loading && (
        <div className={styles.message} data-type="info">
          <span>Loading real-time data...</span>
        </div>
      )}

      <div className={styles.tabContent}>
        {activeTab === 'orders' && (
          <OrdersTab
            orders={visibleOrders}
            menuItems={menuItems}
            sortMode={sortMode}
            onSortChange={setSortMode}
            updatingOrderId={updatingOrderId}
            onAdvance={handleAdvance}
          />
        )}

        {activeTab === 'seatmap' && (
          <SeatMapTab
            orders={orders}
            menuItems={menuItems}
            session={sessionData}
            updatingOrderId={updatingOrderId}
            onStatusChange={handleSetOrderStatus}
          />
        )}

        {activeTab === 'menu' && (isAssignedToActiveFlight || role === 'admin') && (
          <MenuManagementTab
            role={role}
            items={menuItems}
            saving={savingItem}
            onSave={handleSaveMenu}
            onDelete={handleDeleteMenu}
            onUploadImage={uploadMenuItemImage}
          />
        )}

        {activeTab === 'sessions' && canManageSessions && <SessionsTab />}

        {activeTab === 'reports' && (isAdminForActiveFlight || role === 'admin') && (
          <ReportsTab orders={orders} menuItems={menuItems} summary={reportSummary} onRefresh={loadReport} />
        )}

        {activeTab === 'settings' && (role === 'admin' || role === 'crew') && <SettingsTab role={role} />}
      </div>
    </AdminLayout>
  )
}

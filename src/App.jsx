/**
 * IFMOD routes: passenger session entry and crew dashboard.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './context/SessionProvider'
import { ToastProvider } from './context/ToastProvider'
import ToastContainer from './components/ui/ToastContainer'
import RequireSession from './components/routing/RequireSession'
import RequireRole from './components/routing/RequireRole'
import RequireFlightInstance from './components/routing/RequireFlightInstance'
import AdminRouteHandler from './components/routing/AdminRouteHandler'
import RootRedirect from './components/routing/RootRedirect'
import SessionEntryPage from './pages/SessionEntryPage'
import MenuPage from './pages/MenuPage'
import MenuCustomizePage from './pages/MenuCustomizePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import CabinCrewLoginPage from './pages/CabinCrewLoginPage'
import AdminSessionSelectionPage from './pages/AdminSessionSelectionPage'
import AdminJoinSessionPage from './pages/AdminJoinSessionPage'
import JoinPage from './pages/JoinPage'
import ManualEntryPage from './pages/ManualEntryPage'

export default function App() {
  return (
    <ToastProvider>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<><RootRedirect /><SessionEntryPage /></>} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/manual-entry" element={<ManualEntryPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/cabin-crew-login" element={<CabinCrewLoginPage />} />
            <Route
              path="/crew/session-join"
              element={
                <RequireRole allowedRoles={['crew']}>
                  <AdminJoinSessionPage />
                </RequireRole>
              }
            />
            <Route
              path="/cabin-crew-join"
              element={
                <RequireRole allowedRoles={['crew']}>
                  <AdminJoinSessionPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin/select-session"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <AdminSessionSelectionPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole allowedRoles={['admin']}>
                  <AdminRouteHandler />
                </RequireRole>
              }
            />
            <Route
              path="/crew/dashboard"
              element={
                <RequireRole allowedRoles={['crew']}>
                  <RequireFlightInstance>
                    <AdminDashboardPage />
                  </RequireFlightInstance>
                </RequireRole>
              }
            />
            <Route
              path="/menu"
              element={
                <RequireSession>
                  <MenuPage />
                </RequireSession>
              }
            />
            <Route
              path="/menu/customize/:mealId"
              element={
                <RequireSession>
                  <MenuCustomizePage />
                </RequireSession>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </SessionProvider>
    </ToastProvider>
  )
}

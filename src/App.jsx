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
import SessionEntryPage from './pages/SessionEntryPage'
import MenuPage from './pages/MenuPage'
import MenuCustomizePage from './pages/MenuCustomizePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
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
            <Route path="/" element={<SessionEntryPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/manual-entry" element={<ManualEntryPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route
              path="/cabin-crew-login"
              element={
                <RequireRole allowedRoles={['admin', 'crew']}>
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
                <RequireRole allowedRoles={['admin', 'crew']}>
                  <AdminRouteHandler />
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

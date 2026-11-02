import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  ADMIN_ROLES,
  dashboardPathForRole,
  RESIDENT_ROLES,
  SECURITY_ROLES,
  useAuth,
} from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import SplashPage from './pages/SplashPage'

const SignInPage = lazy(() => import('./pages/SignInPage'))
const EstateDashboardPage = lazy(() => import('./pages/EstateDashboardPage'))
const RoleDashboardPage = lazy(() => import('./pages/RoleDashboardPage'))
const SecurityDashboardPage = lazy(() => import('./pages/SecurityDashboardPage'))
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'))

function SignInPortal({ portal }) {
  const { loading, profile } = useAuth()

  if (loading) return <main className="route-loading" role="status">Checking your account...</main>
  if (profile) return <Navigate to={dashboardPathForRole(profile.role)} replace />
  return <SignInPage portal={portal} />
}

function App() {
  const [bootState, setBootState] = useState(null)

  if (!bootState) {
    return <SplashPage onComplete={setBootState} />
  }

  return (
    <Suspense fallback={<main className="route-loading" role="status">Preparing your workspace...</main>}>
      <Routes>
        <Route path="/" element={<SignInPortal portal="resident" />} />
        <Route path="/admin" element={<SignInPortal portal="admin" />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route
          path="/admin/dashboard"
          element={(
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <EstateDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute allowedRoles={RESIDENT_ROLES}>
              <RoleDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/security/dashboard"
          element={(
            <ProtectedRoute allowedRoles={SECURITY_ROLES}>
              <SecurityDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App

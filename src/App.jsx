import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  ADMIN_ROLES,
  BUSINESS_ROLES,
  dashboardPathForRole,
  RESIDENT_ROLES,
  SECURITY_ROLES,
  useAuth,
} from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import SplashPage from './pages/SplashPage'

const SignInPage = lazy(() => import('./pages/SignInPage'))
const BusinessRegistrationPage = lazy(() => import('./pages/BusinessRegistrationPage'))
const BusinessDashboardPage = lazy(() => import('./pages/BusinessDashboardPage'))
const PwaLifecycle = lazy(() => import('./components/PwaLifecycle'))
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

  return (
    <>
      {bootState ? (
        <Suspense fallback={<main className="route-loading" role="status">Preparing your workspace...</main>}>
          <Routes>
            <Route path="/" element={<SignInPortal portal="resident" />} />
            <Route path="/admin" element={<SignInPortal portal="admin" />} />
            <Route path="/business" element={<SignInPortal portal="business" />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/business-register" element={<BusinessRegistrationPage />} />
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
              path="/business/dashboard"
              element={(
                <ProtectedRoute allowedRoles={BUSINESS_ROLES}>
                  <BusinessDashboardPage />
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
      ) : <SplashPage onComplete={setBootState} />}
      <Suspense fallback={null}><PwaLifecycle /></Suspense>
    </>
  )
}

export default App

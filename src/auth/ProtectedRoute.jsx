import { Navigate, useLocation } from 'react-router-dom'
import { ADMIN_ROLES, dashboardPathForRole, useAuth } from './AuthProvider'

function ProtectedRoute({ allowedRoles, children }) {
  const { loading, profile } = useAuth()
  const location = useLocation()

  if (loading) {
    return <main className="route-loading" role="status">Checking secure access...</main>
  }

  if (!profile) {
    const signInPath = allowedRoles.some((role) => ADMIN_ROLES.includes(role)) ? '/admin' : '/'
    return <Navigate to={signInPath} replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={dashboardPathForRole(profile.role)} replace />
  }

  return children
}

export default ProtectedRoute

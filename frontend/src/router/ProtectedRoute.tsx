import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/models'

interface Props {
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: Props) {
  const { isAuthenticated, hasRole } = useAuth()

  if (! isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && ! hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

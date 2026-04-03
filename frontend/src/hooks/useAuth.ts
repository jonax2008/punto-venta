import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/models'

export function useAuth() {
  const { user, token, setAuth, setUser, clearAuth } = useAuthStore()

  const hasRole = (...roles: UserRole[]) =>
    user ? roles.includes(user.role) : false

  const canManageProducts = () => hasRole('admin', 'group_manager')
  const canManageUsers    = () => hasRole('admin', 'group_manager')
  const canManageGroups   = () => hasRole('admin')
  const canUsePos         = () => hasRole('admin', 'group_manager', 'cashier')
  const isClient          = () => hasRole('client')

  return {
    user,
    token,
    isAuthenticated: !! token,
    setAuth,
    setUser,
    clearAuth,
    hasRole,
    canManageProducts,
    canManageUsers,
    canManageGroups,
    canUsePos,
    isClient,
  }
}

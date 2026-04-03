import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  UsersRound,
  DollarSign,
  BarChart3,
  LogOut,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { cn } from '@/lib/utils'

interface Props {
  onClose?: () => void
}

export function Sidebar({ onClose }: Props) {
  const { user, clearAuth, canManageProducts, canManageUsers, canManageGroups, canUsePos } = useAuth()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    window.location.href = '/login'
  }

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-50 text-primary'
            : 'text-gray-600 hover:bg-surface-muted hover:text-gray-900'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5">
        <div>
          <h1 className="text-base font-bold text-gray-900">Punto de Venta</h1>
          {user?.group && (
            <p className="text-xs text-gray-500">{user.group.name}</p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItem('/dashboard', <LayoutDashboard className="h-4 w-4" />, 'Dashboard')}
        {canUsePos() && navItem('/orders', <ShoppingCart className="h-4 w-4" />, 'Pedidos')}
        {canUsePos() && navItem('/cash-register', <DollarSign className="h-4 w-4" />, 'Caja')}
        {canManageProducts() && navItem('/products', <Package className="h-4 w-4" />, 'Productos')}
        {canManageUsers() && navItem('/users', <Users className="h-4 w-4" />, 'Usuarios')}
        {canManageGroups() && navItem('/groups', <UsersRound className="h-4 w-4" />, 'Grupos')}
        {canManageProducts() && navItem('/reports', <BarChart3 className="h-4 w-4" />, 'Reportes')}
      </nav>

      {/* Usuario */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600" title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

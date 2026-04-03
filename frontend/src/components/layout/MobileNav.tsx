import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, DollarSign, Package, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { canUsePos, canManageProducts } = useAuth()

  const item = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors',
          isActive ? 'text-primary' : 'text-gray-500'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )

  return (
    <nav className="flex items-center justify-around border-t border-gray-200 bg-white pb-safe-area-inset-bottom">
      {item('/dashboard', <LayoutDashboard className="h-5 w-5" />, 'Inicio')}
      {canUsePos() && item('/orders', <ShoppingCart className="h-5 w-5" />, 'Pedidos')}
      {canUsePos() && item('/cash-register', <DollarSign className="h-5 w-5" />, 'Caja')}
      {canManageProducts() && item('/products', <Package className="h-5 w-5" />, 'Productos')}
      {canManageProducts() && item('/reports', <BarChart3 className="h-5 w-5" />, 'Reportes')}
    </nav>
  )
}

import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { cashRegisterApi } from '@/api/cashRegister'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Link } from 'react-router-dom'

function StatCard({ title, value, icon, color }: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, canUsePos } = useAuth()

  const { data: pendingOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders', 'pending'],
    queryFn: () => ordersApi.list({ status: 'pending' }),
    enabled: canUsePos(),
  })

  const { data: confirmedOrders } = useQuery({
    queryKey: ['orders', 'confirmed-today'],
    queryFn: () => ordersApi.list({ status: 'confirmed' }),
    enabled: canUsePos(),
  })

  const { data: cashRegister, isLoading: loadingRegister } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegisterApi.current(),
    enabled: canUsePos(),
  })

  if (loadingOrders || loadingRegister) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Estado de la caja */}
      {canUsePos() && (
        <div className={`card p-4 flex items-center justify-between ${cashRegister ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center gap-3">
            <DollarSign className={`h-5 w-5 ${cashRegister ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-sm font-medium ${cashRegister ? 'text-emerald-800' : 'text-amber-800'}`}>
                {cashRegister ? 'Caja abierta' : 'Caja cerrada'}
              </p>
              {cashRegister && (
                <p className="text-xs text-emerald-600">
                  Desde {formatDate(cashRegister.opened_at)} · Ventas: {formatCurrency(cashRegister.total_sales)}
                </p>
              )}
            </div>
          </div>
          <Link to="/cash-register" className="btn-secondary text-xs py-1.5">
            {cashRegister ? 'Ver caja' : 'Abrir caja'}
          </Link>
        </div>
      )}

      {/* Stats */}
      {canUsePos() && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Pedidos pendientes"
            value={String(pendingOrders?.meta.total ?? 0)}
            icon={<Clock className="h-6 w-6 text-amber-600" />}
            color="bg-amber-50"
          />
          <StatCard
            title="Pedidos confirmados"
            value={String(confirmedOrders?.meta.total ?? 0)}
            icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            title="Ventas del corte"
            value={formatCurrency(cashRegister?.total_sales ?? 0)}
            icon={<DollarSign className="h-6 w-6 text-primary" />}
            color="bg-primary-50"
          />
          <StatCard
            title="Monto neto"
            value={formatCurrency(cashRegister?.net_amount ?? 0)}
            icon={<ShoppingCart className="h-6 w-6 text-gray-600" />}
            color="bg-surface-muted"
          />
        </div>
      )}

      {/* Accesos rápidos */}
      {canUsePos() && (
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Acciones rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/orders/new" className="btn-primary">
              <ShoppingCart className="h-4 w-4" />
              Nuevo pedido
            </Link>
            <Link to="/orders" className="btn-secondary">
              Ver todos los pedidos
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

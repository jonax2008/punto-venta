import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, DollarSign, Clock, ChefHat, BellRing, ArrowRight } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { cashRegisterApi } from '@/api/cashRegister'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Link } from 'react-router-dom'
import type { OrderStatus } from '@/types/models'

function StatCard({ title, value, icon, color }: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, canUsePos } = useAuth()

  const queryOpts = {
    enabled: canUsePos(),
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  }

  const { data: pendingOrders,   isLoading: loadingOrders }   = useQuery({
    queryKey: ['orders', 'pending', 1],
    queryFn:  () => ordersApi.list({ status: 'pending' }),
    ...queryOpts,
  })

  const { data: preparingOrders } = useQuery({
    queryKey: ['orders', 'preparing', 1],
    queryFn:  () => ordersApi.list({ status: 'preparing' }),
    ...queryOpts,
  })

  const { data: readyOrders } = useQuery({
    queryKey: ['orders', 'ready', 1],
    queryFn:  () => ordersApi.list({ status: 'ready' }),
    ...queryOpts,
  })

  // Pedidos activos para la lista en vivo (pending + confirmed + preparing + ready)
  const { data: activeOrders } = useQuery({
    queryKey: ['orders', 'active-feed'],
    queryFn:  () => ordersApi.list({ page: 1 }),
    ...queryOpts,
  })

  const { data: cashRegister, isLoading: loadingRegister } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn:  () => cashRegisterApi.current(),
    enabled:  canUsePos(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  if (loadingOrders || loadingRegister) return <PageLoader />

  const activeFeed = (activeOrders?.data ?? []).filter(
    (o) => !['cancelled', 'ready'].includes(o.status),
  )

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

      {/* Stats del pipeline */}
      {canUsePos() && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Pendientes de cobro"
            value={pendingOrders?.meta.total ?? 0}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50"
          />
          <StatCard
            title="En preparación"
            value={preparingOrders?.meta.total ?? 0}
            icon={<ChefHat className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Listos para entregar"
            value={readyOrders?.meta.total ?? 0}
            icon={<BellRing className="h-5 w-5 text-purple-600" />}
            color="bg-purple-50"
          />
          <StatCard
            title="Ventas del corte"
            value={formatCurrency(cashRegister?.total_sales ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            color="bg-primary-50"
          />
        </div>
      )}

      {/* Lista de pedidos activos en vivo */}
      {canUsePos() && activeFeed.length > 0 && (
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Pedidos activos</h2>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Se actualiza cada 30 s
            </span>
          </div>
          <div className="space-y-2">
            {activeFeed.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <OrderStatusBadge status={order.status as OrderStatus} />
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-medium text-gray-800">{order.order_number}</span>
                    {order.client_name && (
                      <span className="ml-2 text-xs text-gray-500">{order.client_name}</span>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Accesos rápidos */}
      {canUsePos() && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Acciones rápidas</h2>
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

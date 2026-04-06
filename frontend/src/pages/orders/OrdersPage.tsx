import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { OrderStatus } from '@/types/models'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Todos',           value: '' },
  { label: 'Pendientes',      value: 'pending' },
  { label: 'Cobrados',        value: 'confirmed' },
  { label: 'En preparación',  value: 'preparing' },
  { label: 'Listos',          value: 'ready' },
  { label: 'Cancelados',      value: 'cancelled' },
]

export function OrdersPage() {
  const { canUsePos } = useAuth()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status, page],
    queryFn: () => ordersApi.list({ status: status || undefined, page }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const orders = data?.data ?? []
  const meta   = data?.meta

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        {canUsePos() && (
          <Link to="/orders/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </Link>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setPage(1) }}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-surface-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Sin pedidos"
          description="No hay pedidos con este filtro."
          action={
            canUsePos()
              ? <Link to="/orders/new" className="btn-primary"><Plus className="h-4 w-4" />Crear pedido</Link>
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card flex items-center justify-between p-4 hover:shadow-md transition-shadow"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {order.order_number}
                  </span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                  {order.client_name && (
                    <span className="text-xs font-medium text-gray-700">{order.client_name}</span>
                  )}
                  {order.group && (
                    <span className="text-xs text-gray-400">{order.group.name}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatDate(order.created_at)} · {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="flex-shrink-0 font-bold text-gray-900">
                {formatCurrency(order.total)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Paginación */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-1.5 text-xs"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {meta.current_page} de {meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="btn-secondary py-1.5 text-xs"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

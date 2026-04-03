import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/components/shared/Toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useState } from 'react'
import type { OrderStatus } from '@/types/models'

export function OrderDetailPage() {
  const { id }         = useParams<{ id: string }>()
  const queryClient    = useQueryClient()
  const { toast }      = useToast()
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | null>(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(Number(id)),
  })

  const confirmOrder = useMutation({
    mutationFn: () => ordersApi.confirm(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast('Pedido confirmado')
      setConfirmAction(null)
    },
    onError: () => toast('Error al confirmar', 'error'),
  })

  const cancelOrder = useMutation({
    mutationFn: () => ordersApi.cancel(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast('Pedido cancelado')
      setConfirmAction(null)
    },
    onError: () => toast('Error al cancelar', 'error'),
  })

  if (isLoading) return <PageLoader />
  if (! order) return <div className="p-4 text-sm text-gray-500">Pedido no encontrado</div>

  const isPending = order.status === 'pending'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">{order.order_number}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
        </div>
        {/* Link al tracker (público) */}
        <a
          href={`/track/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost py-2 text-xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Tracker
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Productos */}
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Productos</h2>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{item.product_name}</span>
                  <span className="text-gray-400"> × {item.quantity}</span>
                  {item.notes && <p className="text-xs text-gray-400">{item.notes}</p>}
                </div>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Descuento</span>
                <span className="text-red-500">−{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Detalles */}
        <div className="space-y-4">
          <div className="card p-4 space-y-2">
            <h2 className="font-semibold text-gray-900">Detalles</h2>
            {order.group && (
              <p className="text-sm"><span className="text-gray-500">Grupo:</span> <span className="font-medium">{order.group.name}</span></p>
            )}
            {order.cashier && (
              <p className="text-sm"><span className="text-gray-500">Cajero:</span> <span className="font-medium">{order.cashier.name}</span></p>
            )}
            {order.client && (
              <p className="text-sm"><span className="text-gray-500">Cliente:</span> <span className="font-medium">{order.client.name}</span></p>
            )}
            {order.notes && (
              <p className="text-sm"><span className="text-gray-500">Notas:</span> {order.notes}</p>
            )}
            {order.cancellation_reason && (
              <p className="text-sm"><span className="text-gray-500">Razón de cancelación:</span> {order.cancellation_reason}</p>
            )}
          </div>

          {/* Acciones */}
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction('confirm')}
                className="btn-primary flex-1 justify-center"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar
              </button>
              <button
                onClick={() => setConfirmAction('cancel')}
                className="btn-danger flex-1 justify-center"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction === 'confirm'}
        title="¿Confirmar pedido?"
        description="El pedido se marcará como confirmado y se registrará en el corte de caja."
        confirmLabel="Confirmar pedido"
        variant="warning"
        isLoading={confirmOrder.isPending}
        onConfirm={() => confirmOrder.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        isOpen={confirmAction === 'cancel'}
        title="¿Cancelar pedido?"
        description="El pedido se marcará como cancelado. Esta acción no se puede deshacer."
        confirmLabel="Cancelar pedido"
        variant="danger"
        isLoading={cancelOrder.isPending}
        onConfirm={() => cancelOrder.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

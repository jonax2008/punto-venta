import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, ChefHat, BellRing, DollarSign, X } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useToast } from '@/components/shared/Toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useState } from 'react'
import type { OrderStatus } from '@/types/models'

const MXN_DENOMINATIONS = [10, 20, 50, 100, 200, 500, 1000]

function PaymentDialog({
  isOpen,
  total,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  total: number
  isLoading: boolean
  onConfirm: (amountReceived: number) => void
  onCancel: () => void
}) {
  const [received, setReceived] = useState(0)

  if (!isOpen) return null

  const change = Math.max(0, received - total)
  const canConfirm = received >= total

  const addDenomination = (value: number) => setReceived((r) => r + value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-gray-900">Cobrar pedido</h3>
          </div>
          <button onClick={onCancel} className="btn-ghost p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">Total a cobrar</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>

        <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Billetes / monedas recibidos</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {MXN_DENOMINATIONS.map((d) => (
            <button
              key={d}
              onClick={() => addDenomination(d)}
              className="rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-colors"
            >
              ${d}
            </button>
          ))}
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Recibido</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(received)}</span>
              {received > 0 && (
                <button onClick={() => setReceived(0)} className="text-xs text-gray-400 hover:text-red-500">
                  borrar
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className={canConfirm ? 'text-emerald-600' : 'text-gray-400'}>Cambio</span>
            <span className={canConfirm ? 'text-emerald-600 text-base' : 'text-gray-400'}>
              {formatCurrency(change)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={isLoading}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(received > 0 ? received : total)}
            className="btn-primary flex-1 justify-center"
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner size="sm" />}
            Confirmar cobro
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrderDetailPage() {
  const { id }         = useParams<{ id: string }>()
  const queryClient    = useQueryClient()
  const { toast }      = useToast()
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => ordersApi.get(Number(id)),
  })

  const confirmOrder = useMutation({
    mutationFn: (amountReceived: number) => ordersApi.confirm(Number(id), amountReceived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast('Pedido confirmado')
      setShowPayment(false)
    },
    onError: () => toast('Error al confirmar', 'error'),
  })

  const markPreparing = useMutation({
    mutationFn: () => ordersApi.markPreparing(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast('Pedido marcado como en preparación')
    },
    onError: () => toast('Error al actualizar', 'error'),
  })

  const markReady = useMutation({
    mutationFn: () => ordersApi.markReady(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast('Pedido marcado como listo')
    },
    onError: () => toast('Error al actualizar', 'error'),
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
  if (!order) return <div className="p-4 text-sm text-gray-500">Pedido no encontrado</div>

  const isPending   = order.status === 'pending'
  const isConfirmed = order.status === 'confirmed'
  const isPreparing = order.status === 'preparing'
  const change = order.amount_received != null ? Math.max(0, order.amount_received - order.total) : null

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
            {order.amount_received != null && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Recibido</span>
                  <span>{formatCurrency(order.amount_received)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-emerald-600">
                  <span>Cambio</span>
                  <span>{formatCurrency(change!)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className="space-y-4">
          <div className="card p-4 space-y-2">
            <h2 className="font-semibold text-gray-900">Detalles</h2>
            {(order.client_name || order.client) && (
              <p className="text-sm">
                <span className="text-gray-500">Cliente:</span>{' '}
                <span className="font-medium">{order.client_name ?? order.client?.name}</span>
              </p>
            )}
            {order.group && (
              <p className="text-sm"><span className="text-gray-500">Grupo:</span> <span className="font-medium">{order.group.name}</span></p>
            )}
            {order.cashier && (
              <p className="text-sm"><span className="text-gray-500">Cajero:</span> <span className="font-medium">{order.cashier.name}</span></p>
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
                onClick={() => setShowPayment(true)}
                className="btn-primary flex-1 justify-center"
              >
                <CheckCircle className="h-4 w-4" />
                Cobrar
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

          {isConfirmed && (
            <button
              onClick={() => markPreparing.mutate()}
              disabled={markPreparing.isPending}
              className="btn-primary w-full justify-center"
            >
              {markPreparing.isPending ? <LoadingSpinner size="sm" /> : <ChefHat className="h-4 w-4" />}
              Marcar en preparación
            </button>
          )}

          {isPreparing && (
            <button
              onClick={() => markReady.mutate()}
              disabled={markReady.isPending}
              className="btn-primary w-full justify-center"
            >
              {markReady.isPending ? <LoadingSpinner size="sm" /> : <BellRing className="h-4 w-4" />}
              Marcar como listo
            </button>
          )}
        </div>
      </div>

      <PaymentDialog
        isOpen={showPayment}
        total={order.total}
        isLoading={confirmOrder.isPending}
        onConfirm={(amt) => confirmOrder.mutate(amt)}
        onCancel={() => setShowPayment(false)}
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

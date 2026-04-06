import { useParams } from 'react-router-dom'
import { useOrderTracker } from '@/hooks/useOrderTracker'
import { CheckCircle, Clock, XCircle, ShoppingCart, Wifi, WifiOff, ChefHat, BellRing } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/types/models'

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; label: string; desc: string; color: string }> = {
  pending: {
    icon: <Clock className="h-16 w-16" />,
    label: 'Pedido pendiente',
    desc: 'Tu pedido está en espera de ser cobrado por el cajero.',
    color: 'text-amber-500',
  },
  confirmed: {
    icon: <CheckCircle className="h-16 w-16" />,
    label: '¡Pedido cobrado!',
    desc: 'Tu pago fue recibido. El pedido pasará pronto a preparación.',
    color: 'text-emerald-500',
  },
  preparing: {
    icon: <ChefHat className="h-16 w-16" />,
    label: 'En preparación',
    desc: '¡Tu pedido está siendo preparado! Ya casi está.',
    color: 'text-blue-500',
  },
  ready: {
    icon: <BellRing className="h-16 w-16" />,
    label: '¡Listo para entregar!',
    desc: 'Tu pedido está listo. ¡Pasa a recogerlo!',
    color: 'text-purple-500',
  },
  cancelled: {
    icon: <XCircle className="h-16 w-16" />,
    label: 'Pedido cancelado',
    desc: 'Tu pedido fue cancelado. Si tienes dudas, contáctanos.',
    color: 'text-red-500',
  },
}

const PROGRESS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending',   label: 'Pendiente' },
  { status: 'confirmed', label: 'Cobrado' },
  { status: 'preparing', label: 'Preparando' },
  { status: 'ready',     label: 'Listo' },
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending:   0,
  confirmed: 1,
  preparing: 2,
  ready:     3,
  cancelled: -1,
}

export function OrderTrackerPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const tracker     = useOrderTracker(orderId ?? '')

  const config      = STATUS_CONFIG[tracker.status]
  const currentIdx  = STATUS_ORDER[tracker.status]

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Tracker de pedido</h1>
          {tracker.orderNumber && (
            <p className="mt-1 font-mono text-sm text-gray-500">{tracker.orderNumber}</p>
          )}
          {tracker.clientName && (
            <p className="mt-0.5 text-sm font-medium text-gray-700">{tracker.clientName}</p>
          )}
        </div>

        {/* Estado */}
        <div className="card p-8 text-center space-y-4">
          <div className={`mx-auto ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{config.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{config.desc}</p>
          </div>

          {tracker.confirmedAt && (
            <p className="text-xs text-gray-400">Cobrado: {formatDate(tracker.confirmedAt)}</p>
          )}
          {tracker.preparedAt && (
            <p className="text-xs text-gray-400">En preparación: {formatDate(tracker.preparedAt)}</p>
          )}
          {tracker.readyAt && (
            <p className="text-xs text-gray-400">Listo: {formatDate(tracker.readyAt)}</p>
          )}
          {tracker.cancelledAt && (
            <p className="text-xs text-gray-400">Cancelado: {formatDate(tracker.cancelledAt)}</p>
          )}

          {/* Indicador de conexión */}
          <div className="flex items-center justify-center gap-2">
            {tracker.connected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600">Actualizando en tiempo real</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">Sin conexión</span>
              </>
            )}
          </div>
        </div>

        {/* Barra de progreso (solo cuando no está cancelado) */}
        {tracker.status !== 'cancelled' && (
          <>
            <div className="mt-6 flex items-center">
              {PROGRESS_STEPS.map((step, idx) => {
                const stepIdx    = STATUS_ORDER[step.status]
                const isActive   = currentIdx === stepIdx
                const isComplete = currentIdx > stepIdx

                return (
                  <div key={step.status} className="flex flex-1 items-center">
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isComplete
                          ? 'bg-emerald-500 text-white'
                          : isActive
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < PROGRESS_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-1 rounded-full mx-1 transition-colors ${
                          currentIdx > stepIdx ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-gray-400">
              {PROGRESS_STEPS.map((step) => (
                <span key={step.status}>{step.label}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

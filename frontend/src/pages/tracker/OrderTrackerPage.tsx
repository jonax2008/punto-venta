import { useParams } from 'react-router-dom'
import { useOrderTracker } from '@/hooks/useOrderTracker'
import { CheckCircle, Clock, XCircle, ShoppingCart, Wifi, WifiOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { OrderStatus } from '@/types/models'

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ReactNode; label: string; desc: string; color: string }> = {
  pending: {
    icon: <Clock className="h-16 w-16" />,
    label: 'Pedido pendiente',
    desc: 'Tu pedido está en espera de ser confirmado por el equipo de ventas.',
    color: 'text-amber-500',
  },
  confirmed: {
    icon: <CheckCircle className="h-16 w-16" />,
    label: '¡Pedido confirmado!',
    desc: 'Tu pedido ha sido confirmado. ¡Gracias por tu compra!',
    color: 'text-emerald-500',
  },
  cancelled: {
    icon: <XCircle className="h-16 w-16" />,
    label: 'Pedido cancelado',
    desc: 'Tu pedido fue cancelado. Si tienes dudas, contáctanos.',
    color: 'text-red-500',
  },
}

export function OrderTrackerPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const tracker     = useOrderTracker(orderId ?? '')

  const config = STATUS_CONFIG[tracker.status]

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
            <p className="text-xs text-gray-400">
              Confirmado: {formatDate(tracker.confirmedAt)}
            </p>
          )}
          {tracker.cancelledAt && (
            <p className="text-xs text-gray-400">
              Cancelado: {formatDate(tracker.cancelledAt)}
            </p>
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

        {/* Barra de progreso */}
        <div className="mt-6 flex items-center gap-2">
          {(['pending', 'confirmed'] as OrderStatus[]).map((s, idx) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  tracker.status === s
                    ? 'bg-primary text-white'
                    : tracker.status === 'confirmed' && idx === 0
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {idx + 1}
              </div>
              {idx === 0 && (
                <div className={`flex-1 h-1 rounded-full ${tracker.status === 'confirmed' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-gray-400">
          <span>Pendiente</span>
          <span>Confirmado</span>
        </div>
      </div>
    </div>
  )
}

import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, ArrowLeft, Check } from 'lucide-react'
import { ProductPicker } from '@/components/orders/ProductPicker'
import { useCartStore } from '@/stores/cartStore'
import { ordersApi } from '@/api/orders'
import { cashRegisterApi } from '@/api/cashRegister'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useToast } from '@/components/shared/Toast'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function NewOrderPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const { toast } = useToast()
  const [clientName, setClientName] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)

  const { items, totalAmount, clearCart } = useCartStore()

  const { data: cashRegister } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegisterApi.current(),
  })

  const createOrder = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      clearCart()
      toast('Pedido creado exitosamente')
      navigate(`/orders/${order.id}`)
    },
    onError: () => {
      toast('Error al crear el pedido', 'error')
    },
  })

  const handleSubmit = () => {
    if (items.length === 0) {
      toast('Agrega al menos un producto', 'error')
      return
    }

    createOrder.mutate({
      client_name: clientName.trim() || undefined,
      notes,
      discount,
      items: items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        notes: i.notes || undefined,
      })),
    })
  }

  const subtotal = totalAmount()
  const total    = Math.max(0, subtotal - discount)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo pedido</h1>
      </div>

      {! cashRegister && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No hay caja abierta. <Link to="/cash-register" className="font-medium underline">Abre la caja</Link> antes de crear pedidos.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Selector de productos */}
        <div className="lg:col-span-2">
          <ProductPicker groupId={user?.group_id ?? undefined} />
        </div>

        {/* Resumen del pedido */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Resumen
            </h2>

            {items.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin productos</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.product.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}× {item.product.name}
                    </span>
                    <span className="font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="text-gray-500">Descuento</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="input w-24 text-right py-1 text-sm"
                />
              </div>

              <div className="flex justify-between font-bold text-gray-900 pt-1">
                <span>Total</span>
                <span className="text-lg text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="label">Nombre del cliente (opcional)</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input"
                placeholder="Ej. Juan, Mesa 3..."
                maxLength={100}
              />
            </div>

            <div>
              <label className="label">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none"
                rows={2}
                placeholder="Indicaciones especiales..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => clearCart()}
                className="btn-ghost py-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={items.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1 justify-center"
                disabled={items.length === 0 || createOrder.isPending || ! cashRegister}
              >
                {createOrder.isPending ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4" />}
                Crear pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

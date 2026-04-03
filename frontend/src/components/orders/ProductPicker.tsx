import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Minus, ShoppingCart } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import type { Product } from '@/types/models'

interface Props {
  groupId?: number
}

function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find((i) => i.product.id === product.id)
  const quantity  = cartItem?.quantity ?? 0

  return (
    <div className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="h-28 w-full object-cover"
        />
      ) : (
        <div className="flex h-28 items-center justify-center bg-surface-muted text-4xl">
          🍽️
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(product.price)}</p>

        <div className="mt-3 flex items-center justify-between">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(product)}
              className="btn-primary py-1.5 text-xs w-full justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </button>
          ) : (
            <div className="flex w-full items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-surface-muted"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex-1 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => addItem(product)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductPicker({ groupId }: Props) {
  const [search, setSearch] = useState('')
  const { totalAmount, totalItems } = useCartStore()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', groupId],
    queryFn: () => productsApi.list(groupId),
  })

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="input pl-9"
        />
      </div>

      {/* Resumen del carrito */}
      {totalItems() > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {totalItems()} producto{totalItems() !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-sm font-bold text-primary">{formatCurrency(totalAmount())}</span>
        </div>
      )}

      {/* Grid de productos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500">
          No se encontraron productos
        </div>
      )}
    </div>
  )
}

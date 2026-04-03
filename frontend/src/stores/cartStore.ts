import { create } from 'zustand'
import type { Product } from '@/types/models'

export interface CartItem {
  product: Product
  quantity: number
  notes: string
}

interface CartState {
  items: CartItem[]
  groupId: number | null
  cashRegisterId: number | null
  setContext: (groupId: number, cashRegisterId: number | null) => void
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateNotes: (productId: number, notes: string) => void
  clearCart: () => void
  totalItems: () => number
  totalAmount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  groupId: null,
  cashRegisterId: null,

  setContext: (groupId, cashRegisterId) => set({ groupId, cashRegisterId }),

  addItem: (product) => {
    const { items } = get()
    const existing = items.find((i) => i.product.id === product.id)

    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      })
    } else {
      set({ items: [...items, { product, quantity: 1, notes: '' }] })
    }
  },

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    })
  },

  updateNotes: (productId, notes) =>
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, notes } : i
      ),
    }),

  clearCart: () => set({ items: [] }),

  totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

  totalAmount: () =>
    get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
}))

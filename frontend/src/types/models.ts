export type UserRole = 'admin' | 'group_manager' | 'cashier' | 'client'
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled'
export type CashRegisterStatus = 'open' | 'closed'

export interface Group {
  id: number
  name: string
  slug: string
  is_active: boolean
  manager?: User
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  group_id: number | null
  group?: Group
  avatar_url: string | null
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  frequency?: number
  created_by?: User
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_price: number
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
}

export interface Order {
  id: number
  order_number: string
  group_id: number
  group?: Group
  cash_register_id: number | null
  client?: User | null
  cashier?: User
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  notes: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  items: OrderItem[]
  created_at: string
}

export interface Expense {
  id: number
  cash_register_id: number
  description: string
  amount: number
  registered_by?: User
  created_at: string
}

export interface CashRegister {
  id: number
  group_id: number
  group?: Group
  opened_by?: User
  closed_by?: User | null
  opened_at: string
  closed_at: string | null
  opening_amount: number
  total_sales: number
  total_expenses: number
  net_amount: number
  status: CashRegisterStatus
  auto_closed: boolean
  notes: string | null
  expenses?: Expense[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    first: string
    last: string
    next: string | null
    prev: string | null
  }
}

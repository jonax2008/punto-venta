import apiClient from './client'

export interface SalesByGroupItem {
  group_id: number
  group_name: string
  total_orders: number
  total_sales: number
}

export interface TopProductItem {
  product_id: number
  product_name: string
  total_quantity: number
  total_revenue: number
}

export const reportsApi = {
  salesByGroup: (params: { from?: string; to?: string }) =>
    apiClient
      .get<{ from: string; to: string; data: SalesByGroupItem[] }>('/reports/sales-by-group', { params })
      .then((r) => r.data),

  topProducts: (params: { from?: string; to?: string; group_id?: number; limit?: number }) =>
    apiClient
      .get<{ from: string; to: string; data: TopProductItem[] }>('/reports/top-products', { params })
      .then((r) => r.data),

  cashRegisterHistory: (params: { from?: string; to?: string; group_id?: number }) =>
    apiClient
      .get('/reports/cash-registers', { params })
      .then((r) => r.data),
}

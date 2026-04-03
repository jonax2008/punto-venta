import apiClient from './client'
import type { Order, PaginatedResponse } from '@/types/models'

export interface CreateOrderPayload {
  notes?: string
  discount?: number
  items: { product_id: number; quantity: number; notes?: string }[]
}

export const ordersApi = {
  list: (params?: { status?: string; page?: number }) =>
    apiClient
      .get<PaginatedResponse<Order>>('/orders', { params })
      .then((r) => r.data),

  get: (id: number) =>
    apiClient.get<{ data: Order }>(`/orders/${id}`).then((r) => r.data.data),

  create: (data: CreateOrderPayload) =>
    apiClient.post<{ data: Order }>('/orders', data).then((r) => r.data.data),

  confirm: (id: number) =>
    apiClient.patch<{ data: Order }>(`/orders/${id}/confirm`).then((r) => r.data.data),

  cancel: (id: number, reason?: string) =>
    apiClient
      .patch<{ data: Order }>(`/orders/${id}/cancel`, { reason })
      .then((r) => r.data.data),

  delete: (id: number) => apiClient.delete(`/orders/${id}`),
}

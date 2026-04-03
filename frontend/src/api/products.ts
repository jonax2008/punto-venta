import apiClient from './client'
import type { Product } from '@/types/models'

export const productsApi = {
  list: (groupId?: number) =>
    apiClient
      .get<{ data: Product[] }>('/products', { params: groupId ? { group_id: groupId } : {} })
      .then((r) => r.data.data),

  get: (id: number) =>
    apiClient.get<{ data: Product }>(`/products/${id}`).then((r) => r.data.data),

  create: (data: Partial<Product>) =>
    apiClient.post<{ data: Product }>('/products', data).then((r) => r.data.data),

  update: (id: number, data: Partial<Product>) =>
    apiClient.put<{ data: Product }>(`/products/${id}`, data).then((r) => r.data.data),

  deactivate: (id: number) =>
    apiClient.delete(`/products/${id}`),
}

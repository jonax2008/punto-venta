import apiClient from './client'
import type { User } from '@/types/models'

export const usersApi = {
  list: () =>
    apiClient.get<{ data: User[] }>('/users').then((r) => r.data.data),

  get: (id: number) =>
    apiClient.get<{ data: User }>(`/users/${id}`).then((r) => r.data.data),

  create: (data: {
    name: string
    email: string
    password: string
    role: string
    group_id: number
  }) => apiClient.post<{ data: User }>('/users', data).then((r) => r.data.data),

  update: (id: number, data: Partial<{ name: string; email: string; password: string; role: string; group_id: number }>) =>
    apiClient.put<{ data: User }>(`/users/${id}`, data).then((r) => r.data.data),

  delete: (id: number) => apiClient.delete(`/users/${id}`),
}

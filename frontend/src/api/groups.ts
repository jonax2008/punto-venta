import apiClient from './client'
import type { Group } from '@/types/models'

export const groupsApi = {
  list: () =>
    apiClient.get<{ data: Group[] }>('/groups').then((r) => r.data.data),

  get: (id: number) =>
    apiClient.get<{ data: Group }>(`/groups/${id}`).then((r) => r.data.data),

  update: (id: number, data: { is_active?: boolean; manager_id?: number | null }) =>
    apiClient.put<{ data: Group }>(`/groups/${id}`, data).then((r) => r.data.data),
}

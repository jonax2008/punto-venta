import apiClient from './client'
import type { User } from '@/types/models'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<{ data: User }>('/me').then((r) => r.data),

  googleRedirect: () =>
    apiClient.get<{ redirect_url: string }>('/auth/google/redirect').then((r) => r.data),
}

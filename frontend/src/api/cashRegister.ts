import apiClient from './client'
import type { CashRegister, Expense, PaginatedResponse } from '@/types/models'

export const cashRegisterApi = {
  list: (params?: { page?: number }) =>
    apiClient
      .get<PaginatedResponse<CashRegister>>('/cash-registers', { params })
      .then((r) => r.data),

  current: () =>
    apiClient
      .get<{ data: CashRegister | null }>('/cash-registers/current')
      .then((r) => r.data.data),

  get: (id: number) =>
    apiClient.get<{ data: CashRegister }>(`/cash-registers/${id}`).then((r) => r.data.data),

  open: (data: { opening_amount?: number; notes?: string }) =>
    apiClient
      .post<{ data: CashRegister }>('/cash-registers/open', data)
      .then((r) => r.data.data),

  close: (id: number) =>
    apiClient
      .patch<{ data: CashRegister }>(`/cash-registers/${id}/close`)
      .then((r) => r.data.data),

  listExpenses: (cashRegisterId: number) =>
    apiClient
      .get<{ data: Expense[] }>(`/cash-registers/${cashRegisterId}/expenses`)
      .then((r) => r.data.data),

  addExpense: (cashRegisterId: number, data: { description: string; amount: number }) =>
    apiClient
      .post<{ data: Expense }>(`/cash-registers/${cashRegisterId}/expenses`, data)
      .then((r) => r.data.data),

  deleteExpense: (expenseId: number) => apiClient.delete(`/expenses/${expenseId}`),
}

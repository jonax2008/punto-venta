import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/models'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (token, user) => {
        localStorage.setItem('auth_token', token)
        set({ token, user })
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        localStorage.removeItem('auth_token')
        set({ token: null, user: null })
      },

      isAuthenticated: () => !! get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

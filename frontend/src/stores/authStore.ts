import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  user: {
    userId: string
    email: string
    username: string
    avatarUrl: string
  } | null
  accessToken: string | null
  setAuth: (user: { userId: string; email: string; username: string; avatarUrl: string }, token: string) => void
  clearAuth: () => void
  updateUser: (updates: Partial<{ username: string; email: string; avatarUrl: string }>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      setAuth: (user, token) =>
        set({
          isAuthenticated: true,
          user,
          accessToken: token,
        }),
      clearAuth: () =>
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
        }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'hqmemes-auth',
    }
  )
)


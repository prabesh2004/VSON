import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [picture]
 * @property {boolean} [email_verified]
 */

/**
 * @typedef {Object} AuthState
 * @property {AuthUser|null} user
 * @property {boolean} isAuthenticated
 * @property {(user: AuthUser) => void} login
 * @property {() => void} logout
 */

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'vision-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

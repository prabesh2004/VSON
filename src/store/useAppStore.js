import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * @typedef {Object} AppState
 * @property {'dark'} theme
 * @property {'normal'|'large'|'xl'} fontSize
 * @property {boolean} isConnected
 * @property {string} currentPage
 * @property {(fontSize: AppState['fontSize']) => void} setFontSize
 * @property {(isConnected: boolean) => void} setIsConnected
 * @property {(page: string) => void} setCurrentPage
 */

export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 'normal',
      isConnected: false,
      currentPage: '/',

      setFontSize: (fontSize) => set({ fontSize }),
      setIsConnected: (isConnected) => set({ isConnected }),
      setCurrentPage: (currentPage) => set({ currentPage }),
    }),
    {
      name: 'vision-app-store',
      partialize: (state) => ({
        fontSize: state.fontSize,
        theme: state.theme,
      }),
    }
  )
)

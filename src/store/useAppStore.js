import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WALK_TARGET_FPS_DEFAULT, WALK_TARGET_FPS_MAX, WALK_TARGET_FPS_MIN } from '@/lib/constants'

/**
 * @typedef {Object} AppState
 * @property {'dark'} theme
 * @property {'normal'|'large'|'xl'} fontSize
 * @property {'brief'|'standard'|'detailed'} detailLevel
 * @property {number} voiceSpeed
 * @property {number} walkTargetFps
 * @property {boolean} walkAdaptiveScheduling
 * @property {boolean} isConnected
 * @property {string} currentPage
 * @property {Array<{ id: string, description: string, detailLevel: 'brief'|'standard'|'detailed', confidence?: number, timestamp: number }>} sceneHistory
 * @property {(fontSize: AppState['fontSize']) => void} setFontSize
 * @property {(detailLevel: AppState['detailLevel']) => void} setDetailLevel
 * @property {(voiceSpeed: number) => void} setVoiceSpeed
 * @property {(walkTargetFps: number) => void} setWalkTargetFps
 * @property {(walkAdaptiveScheduling: boolean) => void} setWalkAdaptiveScheduling
 * @property {(isConnected: boolean) => void} setIsConnected
 * @property {(page: string) => void} setCurrentPage
 * @property {(entry: Omit<AppState['sceneHistory'][number], 'id'|'timestamp'>) => void} addSceneHistory
 * @property {() => void} clearSceneHistory
 */

const MAX_SCENE_HISTORY = 8

export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      fontSize: 'normal',
      detailLevel: 'standard',
      voiceSpeed: 1,
      walkTargetFps: WALK_TARGET_FPS_DEFAULT,
      walkAdaptiveScheduling: true,
      isConnected: false,
      currentPage: '/',
      sceneHistory: [],

      setFontSize: (fontSize) => set({ fontSize }),
      setDetailLevel: (detailLevel) => set({ detailLevel }),
      setVoiceSpeed: (voiceSpeed) => set({ voiceSpeed }),
      setWalkTargetFps: (walkTargetFps) =>
        set({
          walkTargetFps: Math.min(WALK_TARGET_FPS_MAX, Math.max(WALK_TARGET_FPS_MIN, walkTargetFps)),
        }),
      setWalkAdaptiveScheduling: (walkAdaptiveScheduling) => set({ walkAdaptiveScheduling }),
      setIsConnected: (isConnected) => set({ isConnected }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      addSceneHistory: (entry) =>
        set((state) => ({
          sceneHistory: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: Date.now(),
              ...entry,
            },
            ...state.sceneHistory,
          ].slice(0, MAX_SCENE_HISTORY),
        })),
      clearSceneHistory: () => set({ sceneHistory: [] }),
    }),
    {
      name: 'vision-app-store',
      partialize: (state) => ({
        fontSize: state.fontSize,
        detailLevel: state.detailLevel,
        voiceSpeed: state.voiceSpeed,
        walkTargetFps: state.walkTargetFps,
        walkAdaptiveScheduling: state.walkAdaptiveScheduling,
        theme: state.theme,
      }),
    }
  )
)

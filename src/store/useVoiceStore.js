import { create } from 'zustand'

/**
 * @typedef {Object} VoiceState
 * @property {boolean} isListening
 * @property {boolean} isProcessing
 * @property {string|null} lastCommand
 * @property {boolean} isSpeaking
 * @property {string|null} liveTranscript
 * @property {(isListening: boolean) => void} setIsListening
 * @property {(isProcessing: boolean) => void} setIsProcessing
 * @property {(command: string|null) => void} setLastCommand
 * @property {(isSpeaking: boolean) => void} setIsSpeaking
 * @property {(transcript: string|null) => void} setLiveTranscript
 * @property {() => void} reset
 */

export const useVoiceStore = create((set) => ({
  isListening: false,
  isProcessing: false,
  lastCommand: null,
  isSpeaking: false,
  liveTranscript: null,

  setIsListening: (isListening) => set({ isListening }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setLastCommand: (lastCommand) => set({ lastCommand }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  reset: () =>
    set({
      isListening: false,
      isProcessing: false,
      lastCommand: null,
      isSpeaking: false,
      liveTranscript: null,
    }),
}))

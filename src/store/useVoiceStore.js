import { create } from 'zustand'

/**
 * @typedef {Object} VoiceState
 * @property {'idle'|'listening'|'recognized'|'executed'|'unsupported'|'failed'} commandStatus
 * @property {string|null} commandFeedback
 * @property {string|null} voiceError
 * @property {boolean} isListening
 * @property {boolean} isProcessing
 * @property {string|null} lastCommand
 * @property {boolean} isSpeaking
 * @property {string|null} liveTranscript
 * @property {(status: VoiceState['commandStatus'], message: string|null) => void} setCommandFeedback
 * @property {(message: string|null) => void} setVoiceError
 * @property {() => void} clearFeedback
 * @property {(isListening: boolean) => void} setIsListening
 * @property {(isProcessing: boolean) => void} setIsProcessing
 * @property {(command: string|null) => void} setLastCommand
 * @property {(isSpeaking: boolean) => void} setIsSpeaking
 * @property {(transcript: string|null) => void} setLiveTranscript
 * @property {() => void} reset
 */

export const useVoiceStore = create((set) => ({
  commandStatus: 'idle',
  commandFeedback: null,
  voiceError: null,
  isListening: false,
  isProcessing: false,
  lastCommand: null,
  isSpeaking: false,
  liveTranscript: null,

  setCommandFeedback: (commandStatus, commandFeedback) => set({ commandStatus, commandFeedback }),
  setVoiceError: (voiceError) => set({ voiceError }),
  clearFeedback: () => set({ commandStatus: 'idle', commandFeedback: null, voiceError: null }),
  setIsListening: (isListening) => set({ isListening }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setLastCommand: (lastCommand) => set({ lastCommand }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  reset: () =>
    set({
      commandStatus: 'idle',
      commandFeedback: null,
      voiceError: null,
      isListening: false,
      isProcessing: false,
      lastCommand: null,
      isSpeaking: false,
      liveTranscript: null,
    }),
}))

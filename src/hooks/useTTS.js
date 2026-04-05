import { useCallback, useEffect, useRef } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'
import { synthesizeSpeech } from '@/api/tts'
import { playBase64Audio } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

/**
 * Text-to-speech hook.
 * Primary:  browser SpeechSynthesis API
 * Fallback: POST /tts endpoint
 *
 * @returns {{ speak: (text: string) => Promise<void>, stop: () => void }}
 */
export const useTTS = () => {
  const { setIsSpeaking, setVoiceError, setCommandFeedback } = useVoiceStore()
  const { fontSize, voiceSpeed } = useAppStore()
  const utteranceRef = useRef(null)
  const browserTTSAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    return () => {
      if (browserTTSAvailable) window.speechSynthesis.cancel()
    }
  }, [browserTTSAvailable])

  const stop = useCallback(() => {
    if (browserTTSAvailable) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [browserTTSAvailable, setIsSpeaking])

  const speak = useCallback(
    async (text) => {
      if (!text) return

      setVoiceError(null)

      const fallbackSpeed = fontSize === 'xl' ? 0.85 : fontSize === 'large' ? 0.9 : 1
      const resolvedSpeed = Number.isFinite(voiceSpeed) ? voiceSpeed : fallbackSpeed
      const clampedSpeed = Math.min(2, Math.max(0.5, resolvedSpeed))

      if (browserTTSAvailable) {
        return new Promise((resolve) => {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = clampedSpeed
          utterance.onstart = () => setIsSpeaking(true)
          utterance.onend = () => {
            setIsSpeaking(false)
            resolve()
          }
          utterance.onerror = () => {
            setVoiceError('Speech playback failed. Please try again.')
            setCommandFeedback('failed', 'Speech playback failed.')
            setIsSpeaking(false)
            resolve()
          }
          utteranceRef.current = utterance
          window.speechSynthesis.speak(utterance)
        })
      }

      try {
        setIsSpeaking(true)
        const { audio_base64 } = await synthesizeSpeech({ text, speed: clampedSpeed })
        await playBase64Audio(audio_base64)
      } catch {
        setVoiceError('Text-to-speech service is unavailable right now.')
        setCommandFeedback('failed', 'TTS fallback failed.')
      } finally {
        setIsSpeaking(false)
      }
    },
    [browserTTSAvailable, fontSize, voiceSpeed, setCommandFeedback, setIsSpeaking, setVoiceError]
  )

  return { speak, stop }
}

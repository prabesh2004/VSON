import { useCallback, useEffect, useRef } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'
import { synthesizeSpeech } from '@/api/tts'
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
  const currentAudioRef = useRef(null)
  const speakRequestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.src = ''
        currentAudioRef.current = null
      }
    }
  }, [])

  const stop = useCallback(() => {
    speakRequestIdRef.current += 1
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ''
      currentAudioRef.current = null
    }
    setIsSpeaking(false)
  }, [setIsSpeaking])

  const speak = useCallback(
    async (text) => {
      if (!text) return

      setVoiceError(null)

      const fallbackSpeed = fontSize === 'xl' ? 0.85 : fontSize === 'large' ? 0.9 : 1
      const resolvedSpeed = Number.isFinite(voiceSpeed) ? voiceSpeed : fallbackSpeed
      const clampedSpeed = Math.min(2, Math.max(0.5, resolvedSpeed))

      const requestId = speakRequestIdRef.current + 1
      speakRequestIdRef.current = requestId

      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.src = ''
        currentAudioRef.current = null
      }

      try {
        setIsSpeaking(true)
        const { audio_base64 } = await synthesizeSpeech({ text, speed: clampedSpeed })

        if (requestId !== speakRequestIdRef.current) {
          return
        }

        if (!audio_base64) {
          setVoiceError('TTS service returned empty audio.')
          setCommandFeedback('failed', 'TTS returned empty audio.')
          return
        }

        await new Promise((resolve, reject) => {
          const audio = new Audio(`data:audio/mpeg;base64,${audio_base64}`)
          currentAudioRef.current = audio

          audio.onended = () => resolve()
          audio.onerror = reject

          audio.play().catch(reject)
        })
      } catch (error) {
        const blocked = error?.name === 'NotAllowedError'
        if (blocked) {
          setCommandFeedback('unsupported', 'Audio is blocked until you tap the page once.')
        } else {
          setVoiceError('Speech playback failed. Please try again.')
          setCommandFeedback('failed', 'Speech playback failed.')
        }
      } finally {
        if (requestId === speakRequestIdRef.current) {
          setIsSpeaking(false)
        }
      }
    },
    [fontSize, voiceSpeed, setCommandFeedback, setIsSpeaking, setVoiceError]
  )

  return { speak, stop }
}

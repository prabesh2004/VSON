import { useEffect, useCallback, useRef } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'
import { transcribeAudio } from '@/api/transcribe'
import { VOICE_COMMANDS } from '@/lib/constants'

const browserSTTAvailable =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

/**
 * @typedef {Object} UseVoiceCommandOptions
 * @property {(command: string) => boolean|void|Promise<boolean|void>} onCommand - called when a recognised command is matched
 */

/**
 * Voice command hook.
 * Primary:  browser Web Speech API (SpeechRecognition)
 * Fallback: record audio and POST to /transcribe
 *
 * @param {UseVoiceCommandOptions} options
 * @returns {{ toggleListening: () => void, isSupported: boolean }}
 */
export const useVoiceCommand = ({ onCommand }) => {
  const {
    isListening,
    setIsListening,
    setIsProcessing,
    setLastCommand,
    setLiveTranscript,
    setCommandFeedback,
    setVoiceError,
    clearFeedback,
    reset,
  } = useVoiceStore()

  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const processCommand = useCallback(
    async (transcriptText) => {
      const matched = [...VOICE_COMMANDS]
        .sort((a, b) => b.length - a.length)
        .find((cmd) => transcriptText.includes(cmd))

      if (!matched) {
        setCommandFeedback('unsupported', `Unsupported command: "${transcriptText}"`)
        return
      }

      setCommandFeedback('recognized', `Recognized: ${matched}`)

      try {
        const handled = await Promise.resolve(onCommand(matched))

        if (handled === false) {
          setCommandFeedback('unsupported', `Command not available here: ${matched}`)
          return
        }

        setCommandFeedback('executed', `Executed: ${matched}`)
      } catch {
        setVoiceError('There was a problem executing your voice command. Please try again.')
        setCommandFeedback('failed', `Failed: ${matched}`)
      }
    },
    [onCommand, setCommandFeedback, setVoiceError]
  )

  // ── Browser Speech Recognition ──────────────────────────────────
  const startBrowserSTT = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      clearFeedback()
      setVoiceError(null)
      setCommandFeedback('listening', 'Listening...')
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
      const transcript = results.map((r) => r[0].transcript).join(' ').trim().toLowerCase()
      setLiveTranscript(transcript)

      const final = results.find((r) => r.isFinal)
      if (final) {
        const finalText = final[0].transcript.trim().toLowerCase()
        setLastCommand(finalText)
        void processCommand(finalText)
      }
    }

    recognition.onerror = () => {
      setVoiceError('Speech recognition failed. Please try again.')
      setCommandFeedback('failed', 'Speech recognition failed.')
      setIsListening(false)
      setIsProcessing(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setIsProcessing(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [
    clearFeedback,
    processCommand,
    setCommandFeedback,
    setIsListening,
    setIsProcessing,
    setLastCommand,
    setLiveTranscript,
    setVoiceError,
  ])

  // ── Fallback: MediaRecorder + /transcribe ────────────────────────
  const startFallbackSTT = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      clearFeedback()
      setVoiceError(null)
      setCommandFeedback('listening', 'Listening...')
      setIsListening(true)
      chunksRef.current = []
      const recorder = new MediaRecorder(mediaStream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)

      recorder.onstop = async () => {
        setIsListening(false)
        setIsProcessing(true)
        mediaStream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const { transcript } = await transcribeAudio(blob)
          const lower = transcript.trim().toLowerCase()
          setLiveTranscript(lower)
          setLastCommand(lower)
          await processCommand(lower)
        } catch {
          setVoiceError('Audio transcription failed. Please try again.')
          setCommandFeedback('failed', 'Audio transcription failed.')
        } finally {
          setIsProcessing(false)
        }
      }

      recorder.start()
    } catch {
      setVoiceError('Microphone access failed. Please check browser permissions.')
      setCommandFeedback('failed', 'Microphone access denied.')
      reset()
    }
  }, [
    clearFeedback,
    processCommand,
    reset,
    setCommandFeedback,
    setIsListening,
    setIsProcessing,
    setLastCommand,
    setLiveTranscript,
    setVoiceError,
  ])

  const stopListening = useCallback(() => {
    if (browserSTTAvailable && recognitionRef.current) {
      recognitionRef.current.stop()
    } else if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
  }, [setIsListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else if (browserSTTAvailable) {
      startBrowserSTT()
    } else {
      startFallbackSTT()
    }
  }, [isListening, startBrowserSTT, startFallbackSTT, stopListening])

  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  return { toggleListening, isSupported: browserSTTAvailable || !!navigator.mediaDevices }
}

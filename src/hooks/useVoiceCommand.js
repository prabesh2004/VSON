import { useEffect, useCallback, useRef } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'
import { transcribeAudio } from '@/api/transcribe'
import { VOICE_COMMANDS } from '@/lib/constants'

const browserSTTAvailable =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

/**
 * @typedef {Object} UseVoiceCommandOptions
 * @property {(command: string) => void} onCommand - called when a recognised command is matched
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
  const { isListening, setIsListening, setIsProcessing, setLastCommand, setLiveTranscript, reset } =
    useVoiceStore()

  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  // ── Browser Speech Recognition ──────────────────────────────────
  const startBrowserSTT = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
      const transcript = results.map((r) => r[0].transcript).join(' ').trim().toLowerCase()
      setLiveTranscript(transcript)

      const final = results.find((r) => r.isFinal)
      if (final) {
        const finalText = final[0].transcript.trim().toLowerCase()
        setLastCommand(finalText)
        const matched = VOICE_COMMANDS.find((cmd) => finalText.includes(cmd))
        if (matched) onCommand(matched)
      }
    }

    recognition.onerror = () => {
      reset()
    }

    recognition.onend = () => {
      setIsListening(false)
      setIsProcessing(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [onCommand, reset, setIsListening, setIsProcessing, setLastCommand, setLiveTranscript])

  // ── Fallback: MediaRecorder + /transcribe ────────────────────────
  const startFallbackSTT = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
          setLastCommand(lower)
          const matched = VOICE_COMMANDS.find((cmd) => lower.includes(cmd))
          if (matched) onCommand(matched)
        } catch {
          // silent fallback failure
        } finally {
          setIsProcessing(false)
        }
      }

      recorder.start()
    } catch {
      reset()
    }
  }, [onCommand, reset, setIsListening, setIsProcessing, setLastCommand])

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

import { useEffect, useCallback, useRef } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'
import { transcribeAudio } from '@/api/transcribe'
import { VOICE_COMMANDS } from '@/lib/constants'

const browserSTTAvailable =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

const normalizeTranscript = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const COMMAND_ALIASES = [
  { command: 'start', patterns: ['start', 'start camera', 'camera start', 'start the camera'] },
  { command: 'walk mode', patterns: ['walk mode', 'enable walk mode', 'turn on walk mode'] },
  { command: 'describe in detail', patterns: ['describe in detail', 'detailed describe', 'describe details'] },
  { command: 'describe', patterns: ['describe', 'described', 'scene describe', 'describe surroundings'] },
  { command: 'capture', patterns: ['capture', 'take capture', 'take picture', 'take a picture'] },
  { command: 'start walk mode', patterns: ['start walk mode', 'start walk', 'walk mode start', 'start walk more'] },
  { command: 'pause walk mode', patterns: ['pause walk mode', 'pause walk', 'pause mode'] },
  { command: 'resume walk mode', patterns: ['resume walk mode', 'resume walk', 'continue walk mode'] },
  { command: 'stop walk mode', patterns: ['stop walk mode', 'end walk mode', 'stop walk'] },
  { command: 'stop mic', patterns: ['stop mic', 'stop microphone', 'mute mic', 'mute microphone'] },
  { command: 'settings', patterns: ['settings', 'open settings'] },
  { command: 'go back', patterns: ['go back', 'back'] },
  { command: 'repeat', patterns: ['repeat', 'say again', 'read again'] },
  { command: 'tutorial', patterns: ['tutorial', 'play tutorial', 'open tutorial', 'how to use'] },
  { command: 'help', patterns: ['help', 'voice help', 'open help'] },
  { command: 'stop', patterns: ['stop', 'stop speaking', 'cancel'] },
]

const findCommandInTranscript = (transcriptText) => {
  const normalized = normalizeTranscript(transcriptText)
  if (!normalized) return null
  const words = normalized.split(' ').filter(Boolean)

  const hasWord = (...tokens) => words.some((word) => tokens.includes(word))
  const hasApproxHelp = words.some((word) => /^h[ea]lp/.test(word))

  if (hasApproxHelp) return 'help'
  if (normalized.includes('tutorial') || normalized.includes('how to use')) return 'tutorial'
  if (normalized.includes('setting')) return 'settings'
  if (normalized.includes('go back') || words.includes('back')) return 'go back'
  if (hasWord('repeat', 'again') || normalized.includes('say again') || normalized.includes('read again')) return 'repeat'

  if (hasWord('describe', 'described')) {
    if (normalized.includes('detail') || normalized.includes('detailed')) return 'describe in detail'
    return 'describe'
  }

  if (hasWord('capture', 'captured') || (normalized.includes('take') && normalized.includes('picture'))) {
    return 'capture'
  }

  if (normalized.includes('walk') && normalized.includes('mode') && !normalized.includes('start') && !normalized.includes('pause') && !normalized.includes('resume') && !normalized.includes('continue') && !normalized.includes('stop')) {
    return 'walk mode'
  }
  if (normalized.includes('start') && normalized.includes('walk') && (normalized.includes('mode') || normalized.includes('more'))) return 'start walk mode'
  if (normalized === 'start' || normalized.includes('start camera') || normalized.includes('camera start')) return 'start'
  if (normalized.includes('pause') && normalized.includes('walk')) return 'pause walk mode'
  if ((normalized.includes('resume') || normalized.includes('continue')) && normalized.includes('walk'))
    return 'resume walk mode'
  if (normalized.includes('stop') && normalized.includes('walk')) return 'stop walk mode'
  if (normalized.includes('stop') && (normalized.includes('mic') || normalized.includes('microphone')))
    return 'stop mic'
  if (normalized.includes('stop')) return 'stop'

  for (const alias of COMMAND_ALIASES) {
    if (alias.patterns.some((pattern) => normalized.includes(pattern))) {
      return alias.command
    }
  }

  return [...VOICE_COMMANDS]
    .sort((a, b) => b.length - a.length)
    .find((cmd) => normalized.includes(cmd))
}

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
  const keepListeningRef = useRef(false)
  const lastHandledCommandRef = useRef(null)
  const lastHandledAtRef = useRef(0)
  const recorderAutoStopRef = useRef(null)
  const networkErrorCountRef = useRef(0)
  const shouldUseFallbackRef = useRef(false)
  const fallbackLoopActiveRef = useRef(false)
  const startFallbackRef = useRef(() => {})
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const clearRecorderAutoStop = useCallback(() => {
    if (recorderAutoStopRef.current) {
      clearTimeout(recorderAutoStopRef.current)
      recorderAutoStopRef.current = null
    }
  }, [])

  const processCommand = useCallback(
    async (transcriptText) => {
      const matched = findCommandInTranscript(transcriptText)

      if (!matched) {
        setCommandFeedback('unsupported', `Unsupported command: "${transcriptText}"`)
        return
      }

      setCommandFeedback('recognized', `Recognized: ${matched}`)
      console.info('[Voice] Command matched:', matched)

      try {
        const handled = await Promise.resolve(onCommand(matched))

        if (handled === false) {
          setCommandFeedback('unsupported', `Command not available here: ${matched}`)
          return
        }

        setCommandFeedback('executed', `Executed: ${matched}`)
        console.info('[Voice] Command executed:', matched)
      } catch {
        setVoiceError('There was a problem executing your voice command. Please try again.')
        setCommandFeedback('failed', `Failed: ${matched}`)
        console.info('[Voice] Command failed:', matched)
      }
    },
    [onCommand, setCommandFeedback, setVoiceError]
  )

  // ── Browser Speech Recognition ──────────────────────────────────
  const startBrowserSTT = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      keepListeningRef.current = true
      lastHandledCommandRef.current = null
      lastHandledAtRef.current = 0
      clearFeedback()
      setVoiceError(null)
      setCommandFeedback('listening', 'Listening...')
      setIsListening(true)
      console.info('[Voice] Browser recognition started')
    }

    recognition.onresult = (event) => {
      const latest = event.results?.[event.resultIndex]
      const transcript = latest?.[0]?.transcript?.trim().toLowerCase() ?? ''
      if (!transcript) return

      setLiveTranscript(transcript)
      console.info('[Voice] Transcript heard:', transcript)

      if (!latest?.isFinal) {
        return
      }

      networkErrorCountRef.current = 0

      const matched = findCommandInTranscript(transcript)
      if (!matched) return

      const now = Date.now()
      if (lastHandledCommandRef.current === matched && now - lastHandledAtRef.current < 1200) {
        return
      }

      lastHandledCommandRef.current = matched
      lastHandledAtRef.current = now
      setLastCommand(transcript)
      console.info('[Voice] Command recognized:', matched)
      void processCommand(transcript)
    }

    recognition.onerror = (event) => {
      const errorCode = event?.error
      console.info('[Voice] Recognition error:', errorCode)

      // These are often transient in browser STT; keep the loop alive.
      if (errorCode === 'no-speech' || errorCode === 'aborted' || errorCode === 'network') {
        if (errorCode === 'network') {
          networkErrorCountRef.current += 1
          if (networkErrorCountRef.current >= 3) {
            shouldUseFallbackRef.current = true
            setCommandFeedback('failed', 'Browser voice unstable. Switching to backup speech recognition...')
            try {
              recognition.stop()
            } catch {
              // If stop fails, onend usually follows; fallback will trigger there.
            }
            return
          }
        }

        setCommandFeedback(
          'listening',
          errorCode === 'network' ? 'Reconnecting voice recognition...' : 'Listening...'
        )
        return
      }

      keepListeningRef.current = false

      if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
        setVoiceError('Microphone permission denied. Allow microphone access and try again.')
        setCommandFeedback('failed', 'Microphone permission denied.')
      } else if (errorCode === 'audio-capture') {
        setVoiceError('No microphone detected. Check your audio input device.')
        setCommandFeedback('failed', 'No microphone detected.')
      } else {
        setVoiceError('Speech recognition failed. Please try again.')
        setCommandFeedback('failed', 'Speech recognition failed.')
      }

      setIsListening(false)
      setIsProcessing(false)
    }

    recognition.onend = () => {
      console.info('[Voice] Browser recognition ended')

      if (shouldUseFallbackRef.current && keepListeningRef.current) {
        shouldUseFallbackRef.current = false
        console.info('[Voice] Switching to fallback transcription loop')
        void startFallbackRef.current()
        return
      }

      if (keepListeningRef.current) {
        try {
          recognition.start()
          return
        } catch {
          // If restart fails, fall through and reset listening state.
        }
      }

      setIsListening(false)
      setIsProcessing(false)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      keepListeningRef.current = false
      setVoiceError('Speech recognition could not start. Please try again.')
      setCommandFeedback('failed', 'Speech recognition could not start.')
      setIsListening(false)
      setIsProcessing(false)
    }
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
    if (fallbackLoopActiveRef.current || !keepListeningRef.current) return

    try {
      fallbackLoopActiveRef.current = true
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.info('[Voice] Fallback transcription capture started')
      clearFeedback()
      setVoiceError(null)
      setCommandFeedback('listening', 'Listening...')
      setIsListening(true)
      chunksRef.current = []
      const recorder = new MediaRecorder(mediaStream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)

      recorder.onstop = async () => {
        clearRecorderAutoStop()
        fallbackLoopActiveRef.current = false
        setIsProcessing(true)
        mediaStream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const { transcript, confidence } = await transcribeAudio(blob)
          const lower = transcript.trim().toLowerCase()
          console.info('[Voice] Transcription received:', lower)

          if (!lower) {
            setCommandFeedback('listening', 'Listening...')
            return
          }

          const matched = findCommandInTranscript(lower)
          if (!matched) {
            setCommandFeedback('unsupported', `Unsupported command: "${lower}"`)
            return
          }

          const words = lower.split(' ').filter(Boolean)
          const minConfidence = words.length <= 1 ? 0.9 : 0.75
          if (Number.isFinite(confidence) && confidence < minConfidence) {
            setCommandFeedback('unsupported', `Ignored low-confidence transcript: "${lower}" (${confidence.toFixed(2)})`)
            console.info('[Voice] Ignored low-confidence command transcript', { lower, confidence, minConfidence })
            return
          }

          setLiveTranscript(lower)
          setLastCommand(lower)
          await processCommand(lower)
        } catch (error) {
          const message = error?.message ?? 'Audio transcription failed. Please try again.'
          const isNoSpeech = /no speech detected|stt_empty_transcript/i.test(message)
          if (isNoSpeech) {
            setVoiceError(null)
            setCommandFeedback('listening', 'Listening...')
            console.info('[Voice] No speech detected in fallback capture')
          } else {
            setVoiceError(message)
            setCommandFeedback('failed', message)
            console.info('[Voice] Fallback transcription error:', message)
          }
        } finally {
          setIsProcessing(false)

          if (keepListeningRef.current) {
            void startFallbackSTT()
          } else {
            setIsListening(false)
          }
        }
      }

      recorder.start()
      recorderAutoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 3500)
    } catch {
      fallbackLoopActiveRef.current = false
      setVoiceError('Microphone access failed. Please check browser permissions.')
      setCommandFeedback('failed', 'Microphone access denied.')
      reset()
    }
  }, [
    clearFeedback,
    clearRecorderAutoStop,
    processCommand,
    reset,
    setCommandFeedback,
    setIsListening,
    setIsProcessing,
    setLastCommand,
    setLiveTranscript,
    setVoiceError,
  ])

  useEffect(() => {
    startFallbackRef.current = startFallbackSTT
  }, [startFallbackSTT])

  const stopListening = useCallback(() => {
    clearRecorderAutoStop()
    keepListeningRef.current = false
    shouldUseFallbackRef.current = false
    fallbackLoopActiveRef.current = false
    if (browserSTTAvailable && recognitionRef.current) {
      recognitionRef.current.stop()
    } else if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
    setIsProcessing(false)
  }, [clearRecorderAutoStop, setIsListening, setIsProcessing])

  const startListening = useCallback(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

    if (isListening) return

    keepListeningRef.current = true
    shouldUseFallbackRef.current = false
    networkErrorCountRef.current = 0

    if (browserSTTAvailable) {
      startBrowserSTT()
      return
    }

    if (hasMediaRecorder) {
      void startFallbackSTT()
    }
  }, [isListening, startBrowserSTT, startFallbackSTT])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  return {
    toggleListening,
    startListening,
    stopListening,
    isSupported: browserSTTAvailable || (typeof navigator !== 'undefined' && !!navigator.mediaDevices),
  }
}

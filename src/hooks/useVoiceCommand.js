import { useEffect, useCallback, useRef } from 'react'
import { useVoiceStore } from '@/store/useVoiceStore'
import { transcribeAudio } from '@/api/transcribe'
import { VOICE_COMMANDS } from '@/lib/constants'

const browserSTTAvailable =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

const configuredSttMode = (import.meta.env.VITE_STT_MODE ?? 'backend-first').toLowerCase()

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

  const hasWordPrefix = (prefix) => words.some((word) => word.startsWith(prefix))
  const hasApproxHelp = words.some((word) => /^h[ea]lp/.test(word))

  if (hasWordPrefix('describ')) {
    if (normalized.includes('detail') || normalized.includes('detailed')) return 'describe in detail'
    return 'describe'
  }

  if (hasWordPrefix('captur') || (normalized.includes('take') && normalized.includes('picture'))) {
    return 'capture'
  }

  if (hasApproxHelp) return 'help'
  if (normalized.includes('tutorial') || normalized.includes('how to use')) return 'tutorial'
  if (normalized.includes('setting')) return 'settings'
  if (normalized.includes('go back') || words.includes('back')) return 'go back'
  if (hasWordPrefix('repeat') || normalized.includes('again')) return 'repeat'
  if (normalized.includes('walk') && normalized.includes('mode') && !normalized.includes('start') && !normalized.includes('pause') && !normalized.includes('resume') && !normalized.includes('continue') && !normalized.includes('stop')) {
    return 'walk mode'
  }
  if (normalized.includes('start') && normalized.includes('walk') && (normalized.includes('mode') || normalized.includes('more'))) return 'start walk mode'
  if (normalized === 'start' || normalized.includes('start camera') || normalized.includes('camera start')) return 'start'
  if (normalized.includes('pause') && normalized.includes('walk')) return 'pause walk mode'
  if ((normalized.includes('resume') || normalized.includes('continue')) && normalized.includes('walk'))
    return 'resume walk mode'
  if (normalized.includes('stop') && normalized.includes('walk')) return 'stop walk mode'
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
  const commandHandledRef = useRef(false)
  const listenTimeoutRef = useRef(null)
  const recorderAutoStopRef = useRef(null)
  const networkErrorCountRef = useRef(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const clearListenTimeout = useCallback(() => {
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current)
      listenTimeoutRef.current = null
    }
  }, [])

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

  const openDevCommandPrompt = useCallback(async () => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return

    const typed = window.prompt('Voice debug fallback: type a command (start, stop, walk mode, describe, capture, help).')
    if (!typed) {
      setCommandFeedback('unsupported', 'No command entered.')
      return
    }

    const normalized = normalizeTranscript(typed)
    if (!normalized) {
      setCommandFeedback('unsupported', 'No command entered.')
      return
    }

    setLastCommand(normalized)
    setLiveTranscript(normalized)
    await processCommand(normalized)
  }, [processCommand, setCommandFeedback, setLastCommand, setLiveTranscript])

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
      commandHandledRef.current = false
      networkErrorCountRef.current = 0
      clearFeedback()
      setVoiceError(null)
      setCommandFeedback('listening', 'Listening...')
      setIsListening(true)

      clearListenTimeout()
      listenTimeoutRef.current = setTimeout(() => {
        if (commandHandledRef.current || !keepListeningRef.current) return

        keepListeningRef.current = false
        setCommandFeedback('unsupported', 'Voice timeout. Using command fallback...')

        try {
          recognition.stop()
        } catch {
          // Ignore stop errors and continue to fallback.
        }

        void openDevCommandPrompt()
      }, 8000)
    }

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
      const transcript = results.map((r) => r[0].transcript).join(' ').trim().toLowerCase()
      setLiveTranscript(transcript)

      if (!commandHandledRef.current) {
        const matchedFromInterim = findCommandInTranscript(transcript)
        if (matchedFromInterim) {
          clearListenTimeout()
          commandHandledRef.current = true
          keepListeningRef.current = false
          setLastCommand(transcript)
          void processCommand(transcript)
          recognition.stop()
          return
        }
      }

      const final = results.find((r) => r.isFinal)
      if (final && !commandHandledRef.current) {
        clearListenTimeout()
        const finalText = final[0].transcript.trim().toLowerCase()
        commandHandledRef.current = true
        keepListeningRef.current = false
        setLastCommand(finalText)
        void processCommand(finalText)
        recognition.stop()
      }
    }

    recognition.onerror = (event) => {
      const errorCode = event?.error

      // These are often transient in browser STT; keep the loop alive.
      if (errorCode === 'no-speech' || errorCode === 'aborted' || errorCode === 'network') {
        if (errorCode === 'network') {
          networkErrorCountRef.current += 1
          if (networkErrorCountRef.current >= 2) {
            clearListenTimeout()
            keepListeningRef.current = false
            setCommandFeedback('unsupported', 'Voice service unstable. Using command fallback...')
            try {
              recognition.stop()
            } catch {
              // Ignore stop errors and continue to fallback.
            }
            void openDevCommandPrompt()
            return
          }
        }

        setCommandFeedback(
          'listening',
          errorCode === 'network' ? 'Reconnecting voice recognition...' : 'Listening...'
        )
        return
      }

      clearListenTimeout()
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
      clearListenTimeout()
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
      clearListenTimeout()
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
    clearListenTimeout,
    openDevCommandPrompt,
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
        clearRecorderAutoStop()
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
      recorderAutoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 3500)
    } catch {
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

  const stopListening = useCallback(() => {
    clearListenTimeout()
    clearRecorderAutoStop()
    keepListeningRef.current = false
    if (browserSTTAvailable && recognitionRef.current) {
      recognitionRef.current.stop()
    } else if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
    setIsProcessing(false)
  }, [clearListenTimeout, clearRecorderAutoStop, setIsListening, setIsProcessing])

  const toggleListening = useCallback(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    const useBrowserFirst = configuredSttMode === 'browser-first'

    if (isListening) {
      stopListening()
    } else if (!useBrowserFirst && hasMediaRecorder) {
      startFallbackSTT()
    } else if (browserSTTAvailable) {
      startBrowserSTT()
    } else if (hasMediaRecorder) {
      startFallbackSTT()
    }
  }, [isListening, startBrowserSTT, startFallbackSTT, stopListening])

  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  return {
    toggleListening,
    isSupported: browserSTTAvailable || (typeof navigator !== 'undefined' && !!navigator.mediaDevices),
  }
}

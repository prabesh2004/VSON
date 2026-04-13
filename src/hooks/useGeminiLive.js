import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getFrameDifference } from '@/lib/frameUtils'

/**
 * @typedef {'idle'|'running'|'paused'} LiveMode
 *
 * @typedef {Object} UseGeminiLiveOptions
 * @property {() => string|null} captureFrame
 * @property {number} [intervalMs=1000]
 * @property {boolean} [canRun=true]
 * @property {(description: string, confidence?: number) => void} [onDescription]
 * @property {number} [changeThreshold=8]
 *
 * @typedef {Object} UseGeminiLiveReturn
 * @property {LiveMode} mode
 * @property {boolean} isConnected
 * @property {string|null} latestDescription
 * @property {string|null} lastError
 * @property {() => boolean} start
 * @property {() => boolean} pause
 * @property {() => boolean} resume
 * @property {() => boolean} stop
 * @property {(detailed?: boolean) => boolean} triggerDescribe
 */

const ensureWsBase = (apiBase, wsOverride) => {
  if (wsOverride) return wsOverride

  if (apiBase.startsWith('https://')) return apiBase.replace(/^https:/, 'wss:')
  if (apiBase.startsWith('http://')) return apiBase.replace(/^http:/, 'ws:')

  return 'ws://localhost:8000'
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const toFiniteNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * @param {UseGeminiLiveOptions} options
 * @returns {UseGeminiLiveReturn}
 */
export const useGeminiLive = ({
  captureFrame,
  intervalMs = 1000,
  canRun = true,
  onDescription,
  changeThreshold = toFiniteNumber(import.meta.env.VITE_WALK_MODE_CHANGE_THRESHOLD, 8),
}) => {
  const [mode, setMode] = useState(/** @type {LiveMode} */ ('idle'))
  const [isConnected, setIsConnected] = useState(false)
  const [latestDescription, setLatestDescription] = useState(null)
  const [lastError, setLastError] = useState(null)

  const wsRef = useRef(/** @type {WebSocket|null} */ (null))
  const intervalRef = useRef(/** @type {ReturnType<typeof setInterval>|null} */ (null))
  const pendingStartRef = useRef(false)
  const onDescriptionRef = useRef(onDescription)
  const modeRef = useRef(/** @type {LiveMode} */ ('idle'))
  const canRunRef = useRef(canRun)
  const manualCloseRef = useRef(false)
  const lastFrameRef = useRef(null)
  const isCallingRef = useRef(false)
  const isEvaluatingFrameRef = useRef(false)

  const normalizedChangeThreshold = useMemo(() => clamp(changeThreshold, 0, 100), [changeThreshold])

  const resetFrameGate = useCallback(() => {
    lastFrameRef.current = null
    isCallingRef.current = false
    isEvaluatingFrameRef.current = false
  }, [])

  const setModeState = useCallback((nextMode) => {
    modeRef.current = nextMode
    setMode(nextMode)
  }, [])

  useEffect(() => {
    onDescriptionRef.current = onDescription
  }, [onDescription])

  useEffect(() => {
    canRunRef.current = canRun
  }, [canRun])

  const wsUrl = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    const wsBase = ensureWsBase(apiBase, import.meta.env.VITE_WS_URL)
    return `${wsBase}/ws/live`
  }, [])

  const clearIntervalTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const sendFrame = useCallback(async () => {
    if (!canRunRef.current) {
      pendingStartRef.current = false
      clearIntervalTimer()
      if (modeRef.current !== 'idle') {
        setModeState('idle')
        setLastError('Walk mode stopped because camera or network is unavailable.')
      }
      return
    }

    if (modeRef.current !== 'running') return

    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    if (isCallingRef.current || isEvaluatingFrameRef.current) {
      return
    }

    const frame = captureFrame()
    if (!frame) {
      setLastError('Camera frame is not ready yet.')
      return
    }

    isEvaluatingFrameRef.current = true

    try {
      if (lastFrameRef.current) {
        const difference = await getFrameDifference(lastFrameRef.current, frame)
        if (difference < normalizedChangeThreshold) {
          return
        }
      }

      isCallingRef.current = true
      lastFrameRef.current = frame

      try {
        ws.send(
          JSON.stringify({
            type: 'frame',
            frame,
          })
        )
      } catch {
        isCallingRef.current = false
        setLastError('Failed to send live frame. Please check connection and try again.')
      }
    } finally {
      isEvaluatingFrameRef.current = false
    }
  }, [
    captureFrame,
    clearIntervalTimer,
    normalizedChangeThreshold,
    setModeState,
  ])

  const startIntervalLoop = useCallback(() => {
    clearIntervalTimer()
    void sendFrame()
    intervalRef.current = setInterval(() => {
      void sendFrame()
    }, Math.max(500, Math.round(intervalMs)))
  }, [clearIntervalTimer, intervalMs, sendFrame])

  const connect = useCallback(() => {
    const existing = wsRef.current
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return
    }

    manualCloseRef.current = false
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setLastError(null)

      if (pendingStartRef.current || modeRef.current === 'running') {
        setModeState('running')
        startIntervalLoop()
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'description' && typeof data.description === 'string') {
          isCallingRef.current = false
          setLatestDescription(data.description)
          onDescriptionRef.current?.(data.description, data.confidence)
          return
        }

        if (data.type === 'error' && data.message) {
          isCallingRef.current = false
          setLastError(data.message)
        }
      } catch {
        isCallingRef.current = false
        setLastError('Received invalid response from live server.')
      }
    }

    ws.onerror = () => {
      isCallingRef.current = false
      setLastError('Live connection error. Please check backend server.')
    }

    ws.onclose = () => {
      isCallingRef.current = false
      isEvaluatingFrameRef.current = false
      setIsConnected(false)
      clearIntervalTimer()
      wsRef.current = null

      if (manualCloseRef.current) {
        manualCloseRef.current = false
        return
      }

      if (modeRef.current === 'running') {
        setModeState('paused')
      }
    }
  }, [clearIntervalTimer, setModeState, startIntervalLoop, wsUrl])

  const start = useCallback(() => {
    if (!canRunRef.current || (modeRef.current === 'running' && intervalRef.current)) return false

    setLastError(null)
    pendingStartRef.current = true
    resetFrameGate()
    setModeState('running')

    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      startIntervalLoop()
      return true
    }

    connect()
    return true
  }, [connect, resetFrameGate, setModeState, startIntervalLoop])

  const pause = useCallback(() => {
    if (modeRef.current !== 'running') return false

    pendingStartRef.current = false
    clearIntervalTimer()
    setModeState('paused')
    return true
  }, [clearIntervalTimer, setModeState])

  const resume = useCallback(() => {
    if (!canRunRef.current || modeRef.current !== 'paused') return false

    pendingStartRef.current = true
    resetFrameGate()
    setModeState('running')

    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      startIntervalLoop()
    } else {
      connect()
    }

    return true
  }, [connect, resetFrameGate, setModeState, startIntervalLoop])

  const stop = useCallback(() => {
    if (modeRef.current === 'idle') return false

    pendingStartRef.current = false
    clearIntervalTimer()
    resetFrameGate()
    setModeState('idle')
    setLastError(null)

    const ws = wsRef.current
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      manualCloseRef.current = true
      ws.close()
      wsRef.current = null
      setIsConnected(false)
    }

    return true
  }, [clearIntervalTimer, resetFrameGate, setModeState])

  const triggerDescribe = useCallback(
    (detailed = false) => {
      if (!canRunRef.current) return false

      const frame = captureFrame()
      if (!frame) {
        setLastError('Camera frame is not ready yet.')
        return false
      }

      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'describe',
            frame,
            detailed,
          })
        )
        return true
      }

      connect()
      setLastError('Live connection is opening. Try again in a second.')
      return false
    },
    [captureFrame, connect]
  )

  useEffect(() => {
    return () => {
      clearIntervalTimer()
      resetFrameGate()
      pendingStartRef.current = false
      manualCloseRef.current = true
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [clearIntervalTimer, resetFrameGate])

  useEffect(() => {
    if (canRun) return

    pendingStartRef.current = false
    clearIntervalTimer()
    resetFrameGate()
  }, [canRun, clearIntervalTimer, resetFrameGate])

  const exposedMode = canRun ? mode : 'idle'

  return {
    mode: exposedMode,
    isConnected,
    latestDescription,
    lastError,
    start,
    pause,
    resume,
    stop,
    triggerDescribe,
  }
}

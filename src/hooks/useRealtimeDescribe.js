import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * @typedef {'idle'|'running'|'paused'} RealtimeMode
 * @typedef {'normal'|'elevated'|'high'} SchedulerPressure
 *
 * @typedef {Object} UseRealtimeDescribeOptions
 * @property {() => Promise<boolean>|boolean} runFrame
 * @property {number} [intervalMs=1800]
 * @property {boolean} [adaptiveScheduling=true]
 * @property {boolean} [canRun=true]
 * @property {(error: unknown) => void} [onError]
 */

/**
 * @typedef {Object} UseRealtimeDescribeReturn
 * @property {RealtimeMode} mode
 * @property {number} framesProcessed
 * @property {number|null} lastRunAt
 * @property {number|null} lastDurationMs
 * @property {number} currentIntervalMs
 * @property {SchedulerPressure} schedulerPressure
 * @property {string|null} lastError
 * @property {() => boolean} start
 * @property {() => boolean} pause
 * @property {() => boolean} resume
 * @property {() => boolean} stop
 */

/**
 * Runs a non-overlapping loop for frame-by-frame describe calls.
 *
 * @param {UseRealtimeDescribeOptions} options
 * @returns {UseRealtimeDescribeReturn}
 */
export const useRealtimeDescribe = ({
  runFrame,
  intervalMs = 1800,
  adaptiveScheduling = true,
  canRun = true,
  onError,
}) => {
  const safeBaseInterval = Math.max(300, Math.round(intervalMs))
  const maxAdaptiveInterval = safeBaseInterval * 3

  const [mode, setMode] = useState(/** @type {RealtimeMode} */ ('idle'))
  const [framesProcessed, setFramesProcessed] = useState(0)
  const [lastRunAt, setLastRunAt] = useState(null)
  const [lastDurationMs, setLastDurationMs] = useState(null)
  const [currentIntervalMs, setCurrentIntervalMs] = useState(safeBaseInterval)
  const [schedulerPressure, setSchedulerPressure] = useState(/** @type {SchedulerPressure} */ ('normal'))
  const [lastError, setLastError] = useState(null)

  const timeoutRef = useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null))
  const modeRef = useRef(/** @type {RealtimeMode} */ ('idle'))
  const runFrameRef = useRef(runFrame)

  useEffect(() => {
    runFrameRef.current = runFrame
  }, [runFrame])

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const loop = useCallback(async () => {
    if (modeRef.current !== 'running') return

    const startTime = Date.now()
    let didProcess = false
    try {
      didProcess = await Promise.resolve(runFrameRef.current())
      if (didProcess) {
        setFramesProcessed((count) => count + 1)
        setLastRunAt(Date.now())
      }
      setLastError(null)
    } catch (error) {
      const message =
        /** @type {{message?: string}|null|undefined} */ (error)?.message ??
        'Realtime walkthrough failed. Please try again.'
      setLastError(message)
      onError?.(error)
    } finally {
      const elapsed = Date.now() - startTime
      setLastDurationMs(elapsed)

      let nextDelay = safeBaseInterval
      let nextPressure = /** @type {SchedulerPressure} */ ('normal')

      if (adaptiveScheduling) {
        const loadRatio = elapsed / safeBaseInterval

        if (loadRatio >= 1.35) {
          nextPressure = 'high'
          nextDelay = Math.min(maxAdaptiveInterval, Math.round(safeBaseInterval * Math.min(3, loadRatio + 0.35)))
        } else if (loadRatio >= 0.95) {
          nextPressure = 'elevated'
          nextDelay = Math.min(maxAdaptiveInterval, Math.round(safeBaseInterval * 1.45))
        } else {
          nextDelay = Math.max(300, Math.round(safeBaseInterval * 0.9))
        }

        if (!didProcess) {
          nextPressure = nextPressure === 'high' ? 'high' : 'elevated'
          nextDelay = Math.min(maxAdaptiveInterval, Math.round(nextDelay * 1.2))
        }
      } else if (elapsed > safeBaseInterval) {
        nextPressure = 'elevated'
      }

      setSchedulerPressure(nextPressure)
      setCurrentIntervalMs(nextDelay)

      if (modeRef.current === 'running') {
        timeoutRef.current = setTimeout(() => {
          void loop()
        }, nextDelay)
      }
    }
  }, [adaptiveScheduling, maxAdaptiveInterval, onError, safeBaseInterval])

  const start = useCallback(() => {
    if (!canRun || modeRef.current === 'running') return false

    clearTimer()
    setLastError(null)
    setFramesProcessed(0)
    setSchedulerPressure('normal')
    setCurrentIntervalMs(safeBaseInterval)
    setMode('running')
    modeRef.current = 'running'
    void loop()
    return true
  }, [canRun, clearTimer, loop, safeBaseInterval])

  const pause = useCallback(() => {
    if (modeRef.current !== 'running') return false

    clearTimer()
    setMode('paused')
    modeRef.current = 'paused'
    return true
  }, [clearTimer])

  const resume = useCallback(() => {
    if (!canRun || modeRef.current !== 'paused') return false

    clearTimer()
    setCurrentIntervalMs(safeBaseInterval)
    setSchedulerPressure('normal')
    setMode('running')
    modeRef.current = 'running'
    void loop()
    return true
  }, [canRun, clearTimer, loop, safeBaseInterval])

  const stop = useCallback(() => {
    if (modeRef.current === 'idle') return false

    clearTimer()
    setMode('idle')
    modeRef.current = 'idle'
    return true
  }, [clearTimer])

  useEffect(() => {
    if (canRun) return

    clearTimer()
    if (modeRef.current !== 'idle') {
      setMode('idle')
      modeRef.current = 'idle'
      setLastError('Realtime walkthrough paused because camera or network is unavailable.')
    }
  }, [canRun, clearTimer])

  useEffect(() => {
    if (modeRef.current === 'idle') {
      setCurrentIntervalMs(safeBaseInterval)
      setSchedulerPressure('normal')
    }
  }, [safeBaseInterval])

  useEffect(
    () => () => {
      clearTimer()
    },
    [clearTimer]
  )

  return {
    mode,
    framesProcessed,
    lastRunAt,
    lastDurationMs,
    currentIntervalMs,
    schedulerPressure,
    lastError,
    start,
    pause,
    resume,
    stop,
  }
}

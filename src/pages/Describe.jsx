import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft, BrainCircuit, CircleHelp, Pause, Play, RefreshCw, Square, Wifi, WifiOff } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { CaptureButton } from '@/components/camera/CaptureButton'
import { FramePreview } from '@/components/camera/FramePreview'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { VoiceHelpModal } from '@/components/voice/VoiceHelpModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCamera } from '@/hooks/useCamera'
import { useDescribe } from '@/hooks/useDescribe'
import { useRealtimeDescribe } from '@/hooks/useRealtimeDescribe'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'
import { useAppStore } from '@/store/useAppStore'
import { FONT_SIZE_CLASSES, ROUTES } from '@/lib/constants'

const _MOTION = motion

export const Describe = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const {
    isConnected,
    fontSize,
    detailLevel,
    walkTargetFps,
    walkAdaptiveScheduling,
    addSceneHistory,
  } = useAppStore()
  const { sceneHistory } = useAppStore()
  const fontSizeClass = FONT_SIZE_CLASSES[fontSize] ?? 'text-base'
  const baseWalkIntervalMs = Math.round(1000 / Math.max(0.1, walkTargetFps))

  const { stream, isLoading, error, capturedDataUrl, videoRef, startCamera, stopCamera, captureFrame } =
    useCamera()
  const { describe, describeAsync, data, isPending, error: describeError, reset } = useDescribe()
  const { speak, stop: stopSpeaking } = useTTS()
  const hasAutoSpoken = useRef(false)
  const lastSavedResultKey = useRef('')
  const lastRequestedDetailLevel = useRef(detailLevel)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (data?.description && !hasAutoSpoken.current) {
      hasAutoSpoken.current = true
      speak(data.description)
    }
  }, [data, speak])

  useEffect(() => {
    if (!data?.description) return

    const resultKey = `${data.description}|${data.confidence ?? 'na'}`
    if (lastSavedResultKey.current === resultKey) return

    lastSavedResultKey.current = resultKey
    addSceneHistory({
      description: data.description,
      detailLevel: lastRequestedDetailLevel.current,
      confidence: data.confidence,
    })
  }, [addSceneHistory, data])

  const prepareCapturePayload = useCallback(
    (overrideDetailLevel) => {
      hasAutoSpoken.current = false
      lastSavedResultKey.current = ''
      const requestedDetail = overrideDetailLevel ?? detailLevel
      lastRequestedDetailLevel.current = requestedDetail

      const base64 = captureFrame()
      if (!base64) return null

      return {
        image: base64,
        detailLevel: requestedDetail,
      }
    },
    [captureFrame, detailLevel]
  )

  const handleCapture = useCallback((overrideDetailLevel) => {
    reset()
    const payload = prepareCapturePayload(overrideDetailLevel)
    if (!payload) return false

    describe({ image: payload.image, detail_level: payload.detailLevel })
    return true
  }, [describe, prepareCapturePayload, reset])

  const handleCaptureAsync = useCallback(async (overrideDetailLevel) => {
    const payload = prepareCapturePayload(overrideDetailLevel)
    if (!payload) return false

    await describeAsync({ image: payload.image, detail_level: payload.detailLevel })
    return true
  }, [describeAsync, prepareCapturePayload])

  const canRunWalkMode = Boolean(stream && isConnected && !isLoading)

  const {
    mode: walkMode,
    lastError: walkModeError,
    start: startWalkMode,
    pause: pauseWalkMode,
    resume: resumeWalkMode,
    stop: stopWalkMode,
  } = useRealtimeDescribe({
    runFrame: () => handleCaptureAsync(),
    intervalMs: baseWalkIntervalMs,
    adaptiveScheduling: walkAdaptiveScheduling,
    canRun: canRunWalkMode,
  })

  const handleCommand = useCallback(
    (command) => {
      if (command === 'describe') {
        if (!isConnected) return false
        return handleCapture()
      } else if (command === 'describe in detail') {
        if (!isConnected) return false
        return handleCapture('detailed')
      } else if (command === 'start walk mode') {
        return startWalkMode()
      } else if (command === 'pause walk mode') {
        return pauseWalkMode()
      } else if (command === 'resume walk mode') {
        return resumeWalkMode()
      } else if (command === 'stop walk mode') {
        return stopWalkMode()
      } else if (command === 'stop') {
        if (walkMode !== 'idle') {
          stopWalkMode()
        }
        stopSpeaking()
        return true
      } else if ((command === 'repeat' || command === 'read this page') && data?.description) {
        speak(data.description)
        return true
      } else if (command === 'go back') {
        navigate(-1)
        return true
      } else if (command === 'settings') {
        navigate(ROUTES.SETTINGS)
        return true
      } else if (command === 'open book') {
        navigate(ROUTES.READ_DOC)
        return true
      } else if (command === 'help') {
        setIsHelpOpen(true)
        return true
      }

      return false
    },
    [
      data,
      handleCapture,
      isConnected,
      navigate,
      pauseWalkMode,
      resumeWalkMode,
      speak,
      startWalkMode,
      stopSpeaking,
      stopWalkMode,
      walkMode,
    ]
  )

  const { toggleListening } = useVoiceCommand({ onCommand: handleCommand })

  const handleRestartCamera = useCallback(() => {
    stopCamera()
    setTimeout(() => startCamera(), 300)
  }, [startCamera, stopCamera])

  const cameraStatus = error ? 'Error' : isLoading ? 'Starting' : stream ? 'Live' : 'Inactive'
  const walkModeLabel =
    walkMode === 'running' ? 'Running' : walkMode === 'paused' ? 'Paused' : 'Idle'

  // Expose videoRef to CameraView via a callback ref pattern
  const setVideoRef = useCallback(
    (node) => {
      videoRef.current = node
      if (node && stream) node.srcObject = stream
    },
    [stream, videoRef]
  )

  return (
    <main id="main-content" className="relative min-h-dvh bg-[#0B121B] px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[#1c2f44]/45 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#13314a]/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <header className="mb-5 sm:mb-6 flex flex-wrap items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={18} aria-hidden="true" />}
              onClick={() => navigate(-1)}
              ariaLabel="Go back to home"
            >
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-3xl font-semibold text-[#E9EEF4] leading-tight">Scene Dashboard</h1>
              <p className="font-body text-xs sm:text-sm text-[#7A8B9B] mt-1 leading-relaxed">
                Capture, describe, and replay context from one workspace.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#161F2C]/90 px-3 py-1 text-xs font-body text-[#E9EEF4]">
              {isConnected ? <Wifi size={12} aria-hidden="true" /> : <WifiOff size={12} aria-hidden="true" />}
              {isConnected ? 'Online' : 'Offline'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#161F2C]/90 px-3 py-1 text-xs font-body text-[#E9EEF4]">
              <BrainCircuit size={12} aria-hidden="true" />
              {detailLevel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#161F2C]/90 px-3 py-1 text-xs font-body text-[#E9EEF4]">
              <Activity size={12} aria-hidden="true" />
              Walk: {walkModeLabel}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => navigate(ROUTES.SESSION_MEMORY)}
              ariaLabel="Open session memory page"
            >
              Session Memory ({sceneHistory.length})
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-[#2F3C4C] bg-[linear-gradient(135deg,#192739_0%,#121d2b_100%)] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#E9EEF4]">Live Scene Capture</h2>
                    <p className="font-body text-xs text-[#7A8B9B] mt-1">Use camera or voice commands to describe surroundings.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#2F3C4C] bg-[#0B121B]/80 px-3 py-1 text-xs font-body text-[#E9EEF4]">
                    <Activity size={12} aria-hidden="true" />
                    Camera: {cameraStatus}
                  </span>
                </div>
              </div>

              <div className="p-3 sm:p-5 space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-[#101824] aspect-video flex items-center justify-center border border-[#2F3C4C]">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#161F2C]/90 z-10">
                      <p className="text-[#7A8B9B] font-body animate-pulse">Starting camera…</p>
                    </div>
                  )}
                  {error && !isLoading && (
                    <p role="alert" className="text-[#FF6B6B] font-body text-sm p-6 text-center">
                      {error}
                    </p>
                  )}
                  {stream && (
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!stream && !isLoading && !error && (
                    <p className="text-[#7A8B9B] font-body text-sm">Camera is not active yet.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4">
                  <CaptureButton
                    onCapture={() => handleCapture()}
                    disabled={!isConnected || !stream || isLoading || walkMode === 'running'}
                    isLoading={isPending}
                  />
                  <VoiceButton onToggle={toggleListening} />
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<CircleHelp size={16} aria-hidden="true" />}
                    onClick={() => setIsHelpOpen(true)}
                    ariaLabel="Open voice command help"
                  >
                    Voice Help
                  </Button>
                  {stream && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="col-span-2 sm:col-span-1"
                      leftIcon={<RefreshCw size={16} aria-hidden="true" />}
                      onClick={handleRestartCamera}
                      ariaLabel="Restart camera"
                    >
                      Restart
                    </Button>
                  )}
                </div>

                {!isConnected && (
                  <p role="status" aria-live="polite" className="font-body text-sm text-[#FFB347]">
                    You are offline. Scene description is disabled until connection is restored.
                  </p>
                )}

                <CommandHUD className="!pointer-events-auto" />
              </div>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 self-start">
            <Card className="p-4 sm:p-5">
              <h2 className="font-display text-lg font-semibold text-[#E9EEF4]">Walk Mode (Realtime)</h2>
              <div className="mt-4 rounded-2xl border border-[#2F3C4C] bg-[#0B121B] p-3 sm:p-4">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#161F2C] px-2.5 py-1 text-[11px] font-body text-[#E9EEF4]">
                  {walkModeLabel}
                </span>

                <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Play size={14} aria-hidden="true" />}
                    onClick={startWalkMode}
                    disabled={!canRunWalkMode || walkMode === 'running'}
                    ariaLabel="Start walk mode"
                  >
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Pause size={14} aria-hidden="true" />}
                    onClick={pauseWalkMode}
                    disabled={walkMode !== 'running'}
                    ariaLabel="Pause walk mode"
                  >
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Play size={14} aria-hidden="true" />}
                    onClick={resumeWalkMode}
                    disabled={walkMode !== 'paused' || !canRunWalkMode}
                    ariaLabel="Resume walk mode"
                  >
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="col-span-2 sm:col-span-1"
                    leftIcon={<Square size={14} aria-hidden="true" />}
                    onClick={stopWalkMode}
                    disabled={walkMode === 'idle'}
                    ariaLabel="Stop walk mode"
                  >
                    Stop
                  </Button>
                </div>

                <p className="mt-2 text-xs font-body text-[#7A8B9B]">
                  Continuous scene capture while active, optimized for readable live narration.
                </p>

                {walkModeError && (
                  <p role="alert" className="mt-2 text-xs font-body text-[#FFB347]">
                    {walkModeError}
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <h3 className="font-display text-base font-semibold text-[#E9EEF4]">Latest Capture</h3>
              {capturedDataUrl ? (
                <FramePreview imageDataUrl={capturedDataUrl} className="aspect-video mt-3" />
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[#2F3C4C] bg-[#0B121B] p-5 text-center text-sm font-body text-[#7A8B9B]">
                  Capture a frame to see preview history.
                </div>
              )}
            </Card>

            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 sm:p-5 h-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-[#E9EEF4]">AI Description</h3>
                  {data?.confidence != null && (
                    <span className="text-xs font-body text-[#7A8B9B]">
                      Confidence {(data.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {describeError && (
                  <p role="alert" className="mt-3 text-[#FF6B6B] font-body text-sm">
                    {describeError.message ?? 'Failed to describe scene. Please try again.'}
                  </p>
                )}

                {data?.description ? (
                  <>
                    <div
                      aria-live="polite"
                      aria-atomic="true"
                      aria-label="Scene description"
                      className={`mt-3 text-[#E9EEF4] font-body leading-relaxed ${fontSizeClass}`}
                    >
                      {data.description}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => speak(data.description)}
                        ariaLabel="Read description aloud again"
                      >
                        Read Aloud
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopSpeaking}
                        ariaLabel="Stop reading"
                      >
                        Stop
                      </Button>
                    </div>
                  </>
                ) : !describeError ? (
                  <p className="mt-3 text-sm font-body text-[#7A8B9B]">
                    Scene analysis will appear here after you capture a frame.
                  </p>
                ) : null}
              </Card>
            </motion.div>
          </aside>
        </section>
      </div>

      <VoiceHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  )
}

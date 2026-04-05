import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft, BrainCircuit, CircleHelp, Mic, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { CaptureButton } from '@/components/camera/CaptureButton'
import { FramePreview } from '@/components/camera/FramePreview'
import { SessionMemoryPanel } from '@/components/describe/SessionMemoryPanel'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { VoiceHelpModal } from '@/components/voice/VoiceHelpModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCamera } from '@/hooks/useCamera'
import { useDescribe } from '@/hooks/useDescribe'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'
import { useAppStore } from '@/store/useAppStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { FONT_SIZE_CLASSES, ROUTES } from '@/lib/constants'

const _MOTION = motion

const formatMemoryTime = (timestamp) => {
  if (!timestamp) return 'No history yet'
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const Describe = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const { isConnected, fontSize, detailLevel, sceneHistory, addSceneHistory, clearSceneHistory } = useAppStore()
  const { isListening, isProcessing, isSpeaking } = useVoiceStore()
  const fontSizeClass = FONT_SIZE_CLASSES[fontSize] ?? 'text-base'

  const { stream, isLoading, error, capturedDataUrl, videoRef, startCamera, stopCamera, captureFrame } =
    useCamera()
  const { describe, data, isPending, error: describeError, reset } = useDescribe()
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

  const handleCapture = useCallback((overrideDetailLevel) => {
    hasAutoSpoken.current = false
    lastSavedResultKey.current = ''
    lastRequestedDetailLevel.current = overrideDetailLevel ?? detailLevel
    reset()
    const base64 = captureFrame()
    if (!base64) return false

    describe({ image: base64, detail_level: overrideDetailLevel ?? detailLevel })
    return true
  }, [captureFrame, describe, reset, detailLevel])

  const handleCommand = useCallback(
    (command) => {
      if (command === 'describe') {
        if (!isConnected) return false
        return handleCapture()
      } else if (command === 'describe in detail') {
        if (!isConnected) return false
        return handleCapture('detailed')
      } else if (command === 'stop') {
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
    [data, handleCapture, isConnected, navigate, speak, stopSpeaking]
  )

  const { toggleListening } = useVoiceCommand({ onCommand: handleCommand })

  const handleReplayMemory = useCallback(
    (text) => {
      if (!text) return
      speak(text)
    },
    [speak]
  )

  const handleClearMemory = useCallback(() => {
    clearSceneHistory()
  }, [clearSceneHistory])

  const handleRestartCamera = useCallback(() => {
    stopCamera()
    setTimeout(() => startCamera(), 300)
  }, [startCamera, stopCamera])

  const cameraStatus = error ? 'Error' : isLoading ? 'Starting' : stream ? 'Live' : 'Inactive'
  const voiceStatus = isListening ? 'Listening' : isProcessing ? 'Processing' : isSpeaking ? 'Speaking' : 'Idle'

  // Expose videoRef to CameraView via a callback ref pattern
  const setVideoRef = useCallback(
    (node) => {
      videoRef.current = node
      if (node && stream) node.srcObject = stream
    },
    [stream, videoRef]
  )

  return (
    <main id="main-content" className="relative min-h-dvh bg-[#0B121B] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[#1c2f44]/45 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#13314a]/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={18} aria-hidden="true" />}
              onClick={() => navigate(-1)}
              ariaLabel="Go back to home"
            >
              Back
            </Button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#E9EEF4]">Scene Dashboard</h1>
              <p className="font-body text-sm text-[#7A8B9B] mt-1">
                Capture, describe, and replay context from one workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#161F2C]/90 px-3 py-1 text-xs font-body text-[#E9EEF4]">
              {isConnected ? <Wifi size={12} aria-hidden="true" /> : <WifiOff size={12} aria-hidden="true" />}
              {isConnected ? 'Online' : 'Offline'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2F3C4C] bg-[#161F2C]/90 px-3 py-1 text-xs font-body text-[#E9EEF4]">
              <BrainCircuit size={12} aria-hidden="true" />
              {detailLevel}
            </span>
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

              <div className="p-4 sm:p-5 space-y-4">
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

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <CaptureButton
                    onCapture={() => handleCapture()}
                    disabled={!isConnected || !stream || isLoading}
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

            <div className="grid gap-6 xl:grid-cols-2">
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
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="p-4 sm:p-5">
              <h2 className="font-display text-lg font-semibold text-[#E9EEF4]">Dashboard Status</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#7A8B9B] font-body">Network</p>
                  <p className="mt-1 text-sm font-body text-[#E9EEF4]">{isConnected ? 'Connected' : 'Disconnected'}</p>
                </div>
                <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#7A8B9B] font-body">Voice</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-body text-[#E9EEF4]">
                    <Mic size={13} aria-hidden="true" />
                    {voiceStatus}
                  </p>
                </div>
                <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#7A8B9B] font-body">Memories</p>
                  <p className="mt-1 text-sm font-body text-[#E9EEF4]">{sceneHistory.length} stored</p>
                  <p className="text-[11px] font-body text-[#7A8B9B] mt-1">Latest {formatMemoryTime(sceneHistory[0]?.timestamp)}</p>
                </div>
              </div>
            </Card>

            <SessionMemoryPanel entries={sceneHistory} onReplay={handleReplayMemory} onClear={handleClearMemory} />
          </aside>
        </section>
      </div>

      <VoiceHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  )
}

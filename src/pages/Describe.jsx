import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BrainCircuit, Camera, CircleHelp, LogOut, Pause, Play, RefreshCw, Square, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { FramePreview } from '@/components/camera/FramePreview'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { VoiceHelpModal } from '@/components/voice/VoiceHelpModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCamera } from '@/hooks/useCamera'
import { useDescribe } from '@/hooks/useDescribe'
import { useGeminiLive } from '@/hooks/useGeminiLive'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { FONT_SIZE_CLASSES, ROUTES } from '@/lib/constants'

const _MOTION = motion
const DEV_MOCK_FRAME_BASE64 = 'ZGV2LW1vY2stZnJhbWU='
const TUTORIAL_VOICE_TEXT =
  'Say start to start camera. Say capture to capture an image and describe it. Say walk mode for realtime guidance. Say help to open voice command help. Say tutorial to hear this again.'

const initialsFromName = (name = '') => {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const Describe = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const {
    isConnected,
    fontSize,
    detailLevel,
    walkTargetFps,
    addSceneHistory,
  } = useAppStore()
  const { sceneHistory } = useAppStore()
  const { isSpeaking } = useVoiceStore()
  const fontSizeClass = FONT_SIZE_CLASSES[fontSize] ?? 'text-base'
  const baseWalkIntervalMs = Math.round(1000 / Math.max(0.1, walkTargetFps))
  const tutorialStorageKey = `vision-tutorial-seen:${user?.id ?? 'guest'}`

  const { stream, isVideoReady, isLoading, error, capturedDataUrl, setVideoElement, startCamera, stopCamera, captureFrame } =
    useCamera()
  const { describe, data, isPending, error: describeError, reset } = useDescribe()
  const { speak, stop: stopSpeaking } = useTTS()
  const hasAutoSpoken = useRef(false)
  const lastSavedResultKey = useRef('')
  const lastLiveDescriptionRef = useRef('')
  const lastRequestedDetailLevel = useRef(detailLevel)
  const pendingWalkStartRef = useRef(false)
  const pendingCaptureDetailRef = useRef(null)
  const isCameraLoadingRef = useRef(isLoading)
  const cameraErrorRef = useRef(error)
  const accountMenuRef = useRef(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  useEffect(() => {
    if (data?.description && !hasAutoSpoken.current) {
      hasAutoSpoken.current = true
      speak(data.description)
    }
  }, [data, speak])

  useEffect(() => {
    isCameraLoadingRef.current = isLoading
    cameraErrorRef.current = error
  }, [error, isLoading])

  const playTutorial = useCallback(() => {
    speak(TUTORIAL_VOICE_TEXT)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(tutorialStorageKey, '1')
    }
  }, [speak, tutorialStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return

    const hasSeenTutorial = window.localStorage.getItem(tutorialStorageKey) === '1'
    if (hasSeenTutorial) return

    playTutorial()
  }, [playTutorial, tutorialStorageKey, user?.id])

  useEffect(() => {
    if (!isAccountMenuOpen) return

    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountMenuOpen])

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

      let base64 = captureFrame()

      // In development, allow voice-command testing without camera hardware.
      if (!base64 && import.meta.env.DEV) {
        base64 = DEV_MOCK_FRAME_BASE64
      }

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

  const canRunWalkMode = Boolean(stream && isVideoReady && isConnected && !isLoading)

  const requestCameraStart = useCallback(async () => {
    if (isCameraLoadingRef.current) return false

    const started = await startCamera()
    if (started) return true

    if (!cameraErrorRef.current && !isCameraLoadingRef.current) {
      return startCamera()
    }

    return false
  }, [startCamera])

  const requestCapture = useCallback(
    (overrideDetailLevel) => {
      if (!isConnected) return false

      if (!stream || !isVideoReady) {
        pendingCaptureDetailRef.current = overrideDetailLevel ?? '__default__'
        if (!isLoading) {
          void requestCameraStart()
        }
        return true
      }

      return handleCapture(overrideDetailLevel)
    },
    [handleCapture, isConnected, isLoading, isVideoReady, requestCameraStart, stream]
  )

  const handleLiveDescription = useCallback(
    (description, confidence) => {
      if (!description) return

      if (lastLiveDescriptionRef.current === description) {
        return
      }

      lastLiveDescriptionRef.current = description
      speak(description)
      addSceneHistory({
        description,
        detailLevel: 'brief',
        confidence,
      })
    },
    [addSceneHistory, speak]
  )

  const {
    mode: walkMode,
    lastError: walkModeError,
    start: startWalkMode,
    pause: pauseWalkMode,
    resume: resumeWalkMode,
    stop: stopWalkMode,
    latestDescription: walkLatestDescription,
    triggerDescribe: triggerLiveDescribe,
  } = useGeminiLive({
    captureFrame,
    intervalMs: baseWalkIntervalMs,
    canRun: canRunWalkMode,
    onDescription: handleLiveDescription,
  })

  const handleStartWalkMode = useCallback(() => {
    if (!isConnected) return false

    if (!stream || !isVideoReady) {
      pendingWalkStartRef.current = true
      void requestCameraStart()
      return true
    }

    pendingWalkStartRef.current = false
    return startWalkMode()
  }, [isConnected, isVideoReady, requestCameraStart, startWalkMode, stream])

  const handleStopWalkMode = useCallback(() => {
    pendingWalkStartRef.current = false
    return stopWalkMode()
  }, [stopWalkMode])

  const handleToggleWalkPause = useCallback(() => {
    if (walkMode === 'running') {
      return pauseWalkMode()
    }

    if (walkMode === 'paused') {
      return resumeWalkMode()
    }

    return false
  }, [pauseWalkMode, resumeWalkMode, walkMode])

  const handleLogout = useCallback(() => {
    setIsAccountMenuOpen(false)
    logout()
    navigate(ROUTES.LOGIN)
  }, [logout, navigate])

  const handleToggleCamera = useCallback(() => {
    if (!stream && !isLoading) {
      void requestCameraStart()
      return
    }

    pendingWalkStartRef.current = false
    pendingCaptureDetailRef.current = null
    if (walkMode !== 'idle') {
      stopWalkMode()
    }
    stopCamera()
  }, [isLoading, requestCameraStart, stopCamera, stopWalkMode, stream, walkMode])

  const handleCaptureButtonPress = useCallback(() => {
    requestCapture()
  }, [requestCapture])

  useEffect(() => {
    if (!pendingWalkStartRef.current) return
    if (!stream || !isVideoReady || isLoading || !isConnected) return

    const started = startWalkMode()
    if (started) {
      pendingWalkStartRef.current = false
    }
  }, [isConnected, isLoading, isVideoReady, startWalkMode, stream])

  useEffect(() => {
    if (!pendingCaptureDetailRef.current) return
    if (!stream || !isVideoReady || isLoading || !isConnected) return

    const pendingDetail = pendingCaptureDetailRef.current
    pendingCaptureDetailRef.current = null

    if (pendingDetail === '__default__') {
      handleCapture()
      return
    }

    handleCapture(pendingDetail)
  }, [handleCapture, isConnected, isLoading, isVideoReady, stream])

  useEffect(() => {
    if (!error) return
    pendingWalkStartRef.current = false
    pendingCaptureDetailRef.current = null
  }, [error])

  const handleCommand = useCallback(
    (command) => {
      if (command === 'describe' || command === 'capture') {
        if (walkMode === 'running') {
          if (!isConnected) return false
          return triggerLiveDescribe(false)
        }
        return requestCapture()
      } else if (command === 'describe in detail') {
        if (walkMode === 'running') {
          if (!isConnected) return false
          return triggerLiveDescribe(true)
        }
        return requestCapture('detailed')
      } else if (command === 'start') {
        if (!stream && !isLoading) {
          void requestCameraStart()
        }
        return true
      } else if (command === 'walk mode' || command === 'start walk mode') {
        return handleStartWalkMode()
      } else if (command === 'pause walk mode') {
        return pauseWalkMode()
      } else if (command === 'resume walk mode') {
        return resumeWalkMode()
      } else if (command === 'stop walk mode') {
        return handleStopWalkMode()
      } else if (command === 'stop') {
        if (walkMode !== 'idle') {
          handleStopWalkMode()
        }
        pendingCaptureDetailRef.current = null
        if (stream || isLoading) {
          stopCamera()
        }
        stopSpeaking()
        return true
      } else if (command === 'repeat' && data?.description) {
        speak(data.description)
        return true
      } else if (command === 'go back') {
        navigate(-1)
        return true
      } else if (command === 'settings') {
        navigate(ROUTES.SETTINGS)
        return true
      } else if (command === 'help') {
        setIsHelpOpen(true)
        return true
      } else if (command === 'tutorial') {
        setIsHelpOpen(true)
        playTutorial()
        return true
      }

      return false
    },
    [
      data,
      triggerLiveDescribe,
      isConnected,
      isLoading,
      navigate,
      pauseWalkMode,
      resumeWalkMode,
      speak,
      requestCameraStart,
      handleStartWalkMode,
      handleStopWalkMode,
      requestCapture,
      stopCamera,
      stopSpeaking,
      stream,
      walkMode,
      playTutorial,
    ]
  )

  const { toggleListening } = useVoiceCommand({ onCommand: handleCommand })

  const handleRestartCamera = useCallback(() => {
    stopCamera()
    setTimeout(() => startCamera(), 300)
  }, [startCamera, stopCamera])

  const cameraStatus = error ? 'Error' : isLoading ? 'Starting' : stream ? (isVideoReady ? 'Live' : 'Warming Up') : 'Inactive'
  const shouldShowCaptureButton = Boolean(stream)
  const canCaptureSingleImage = Boolean(stream && isVideoReady && isConnected && !isLoading && walkMode !== 'running')
  const canToggleWalkPause =
    walkMode === 'running' || (walkMode === 'paused' && canRunWalkMode)
  const walkModeLabel =
    walkMode === 'running' ? 'Running' : walkMode === 'paused' ? 'Paused' : 'Idle'
  const activeDescription = walkLatestDescription || data?.description

  return (
    <main id="main-content" className="relative min-h-dvh bg-[#0B121B] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[#1c2f44]/45 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#13314a]/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <header className="mb-5 sm:mb-6 flex flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="w-full flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-3xl font-semibold text-[#E9EEF4] leading-tight">Dashboard</h1>
              <p className="font-body text-xs sm:text-sm text-[#7A8B9B] mt-1 leading-relaxed">
                Capture, describe, and replay context from one workspace.
              </p>
            </div>

            <div ref={accountMenuRef} className="relative flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                className="flex size-10 items-center justify-center rounded-full border-2 border-[#2F3C4C] bg-[#0B121B] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5]"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user?.name ? `${user.name} profile` : 'User profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-display font-semibold text-[#A9D1F5]" aria-hidden="true">
                    {initialsFromName(user?.name)}
                  </span>
                )}
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 min-w-[130px] max-w-[calc(100vw-2rem)] rounded-lg border border-[#2F3C4C] bg-[#161F2C] p-2 shadow-xl z-20">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full justify-center"
                    leftIcon={<LogOut size={14} aria-hidden="true" />}
                    onClick={handleLogout}
                    ariaLabel="Log out"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isConnected ? 'secondary' : 'destructive'} className="h-7 gap-1 px-2.5">
                {isConnected ? <Wifi size={12} aria-hidden="true" /> : <WifiOff size={12} aria-hidden="true" />}
                {isConnected ? 'Online' : 'Offline'}
              </Badge>
              <Badge variant="outline" className="h-7 gap-1 px-2.5">
                <BrainCircuit size={12} aria-hidden="true" />
                {detailLevel}
              </Badge>
              <Badge variant="outline" className="h-7 gap-1 px-2.5">
                <Activity size={12} aria-hidden="true" />
                Walk: {walkModeLabel}
              </Badge>
            </div>

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

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
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
                <Separator />

                <div className="relative rounded-2xl overflow-hidden bg-[#101824] aspect-video flex items-center justify-center border border-[#2F3C4C]">
                  <video
                    ref={setVideoElement}
                    autoPlay
                    playsInline
                    muted
                    aria-hidden="true"
                    className={`w-full h-full object-cover ${stream && isVideoReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  />

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
                  {stream && !isVideoReady && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#161F2C]/65 z-10">
                      <p className="text-[#E9EEF4] font-body text-sm">Warming camera up…</p>
                    </div>
                  )}
                  {!stream && !isLoading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        className="text-[#7A8B9B] font-body text-sm text-center rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5]"
                      >
                        Camera is not active yet.
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[#2F3C4C] bg-[#0B121B]/70 p-2.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <Button
                      variant={stream ? 'secondary' : 'primary'}
                      size="sm"
                      className="size-12 shrink-0 p-0"
                      onClick={handleToggleCamera}
                      disabled={isLoading}
                      ariaLabel={isLoading ? 'Camera is starting' : stream ? 'Stop camera' : 'Start camera'}
                    >
                      {isLoading ? <RefreshCw size={20} className="animate-spin" aria-hidden="true" /> : stream ? <Square size={20} aria-hidden="true" /> : <Camera size={20} aria-hidden="true" />}
                    </Button>

                    {shouldShowCaptureButton && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="size-12 shrink-0 p-0"
                        onClick={handleCaptureButtonPress}
                        disabled={!canCaptureSingleImage || isPending}
                        ariaLabel="Capture image and describe scene"
                      >
                        {isPending ? <RefreshCw size={20} className="animate-spin" aria-hidden="true" /> : <Camera size={20} aria-hidden="true" />}
                      </Button>
                    )}

                    <VoiceButton onToggle={toggleListening} compact hideStatus className="shrink-0" />

                    <Button
                      variant={isSpeaking ? 'primary' : 'secondary'}
                      size="sm"
                      className="h-10 shrink-0 px-3"
                      leftIcon={isSpeaking ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                      onClick={isSpeaking ? stopSpeaking : undefined}
                      disabled={!isSpeaking}
                      ariaLabel={isSpeaking ? 'Stop speaking' : 'AI speaker idle'}
                    >
                      {isSpeaking ? 'Speaking' : 'Speaker'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-10 shrink-0 px-3"
                      leftIcon={<CircleHelp size={16} aria-hidden="true" />}
                      onClick={() => setIsHelpOpen(true)}
                      ariaLabel="Open voice command help"
                    >
                      Help
                    </Button>

                    {stream && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-12 shrink-0 p-0"
                        onClick={handleRestartCamera}
                        ariaLabel="Restart camera"
                      >
                        <RefreshCw size={18} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
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
                <Badge variant="outline" className="h-6 text-[11px]">
                  {walkModeLabel}
                </Badge>

                <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Play size={14} aria-hidden="true" />}
                    onClick={handleStartWalkMode}
                    disabled={!isConnected || isLoading || walkMode === 'running' || (stream && !isVideoReady)}
                    ariaLabel="Start walk mode"
                  >
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={walkMode === 'running' ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                    onClick={handleToggleWalkPause}
                    disabled={!canToggleWalkPause}
                    ariaLabel={walkMode === 'running' ? 'Pause walk mode' : 'Resume walk mode'}
                  >
                    {walkMode === 'running' ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="col-span-2 sm:col-span-1"
                    leftIcon={<Square size={14} aria-hidden="true" />}
                    onClick={handleStopWalkMode}
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
                  {data?.confidence != null && !walkLatestDescription && (
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

                {activeDescription ? (
                  <>
                    <div
                      aria-live="polite"
                      aria-atomic="true"
                      aria-label="Scene description"
                      className={`mt-3 text-[#E9EEF4] font-body leading-relaxed ${fontSizeClass}`}
                    >
                      {activeDescription}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => speak(activeDescription)}
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

      <VoiceHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} onTutorial={playTutorial} />
    </main>
  )
}

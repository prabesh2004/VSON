import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { CameraView } from '@/components/camera/CameraView'
import { CaptureButton } from '@/components/camera/CaptureButton'
import { FramePreview } from '@/components/camera/FramePreview'
import { VoiceButton } from '@/components/voice/VoiceButton'
import { CommandHUD } from '@/components/voice/CommandHUD'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCamera } from '@/hooks/useCamera'
import { useDescribe } from '@/hooks/useDescribe'
import { useTTS } from '@/hooks/useTTS'
import { useVoiceCommand } from '@/hooks/useVoiceCommand'
import { useAppStore } from '@/store/useAppStore'
import { FONT_SIZE_CLASSES } from '@/lib/constants'

export const Describe = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const { fontSize } = useAppStore()
  const fontSizeClass = FONT_SIZE_CLASSES[fontSize] ?? 'text-base'

  const { stream, isLoading, error, capturedDataUrl, videoRef, startCamera, stopCamera, captureFrame } =
    useCamera()
  const { describe, data, isPending, error: describeError, reset } = useDescribe()
  const { speak, stop: stopSpeaking } = useTTS()
  const hasAutoSpoken = useRef(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (data?.description && !hasAutoSpoken.current) {
      hasAutoSpoken.current = true
      speak(data.description)
    }
  }, [data, speak])

  const handleCapture = useCallback(() => {
    hasAutoSpoken.current = false
    reset()
    const base64 = captureFrame()
    if (base64) describe({ image: base64 })
  }, [captureFrame, describe, reset])

  const handleCommand = useCallback(
    (command) => {
      if (command === 'describe' || command === 'describe in detail') {
        handleCapture()
      } else if (command === 'stop') {
        stopSpeaking()
      } else if (command === 'repeat' && data?.description) {
        speak(data.description)
      } else if (command === 'go back') {
        navigate(-1)
      }
    },
    [handleCapture, stopSpeaking, data, speak, navigate]
  )

  const { toggleListening } = useVoiceCommand({ onCommand: handleCommand })

  // Expose videoRef to CameraView via a callback ref pattern
  const setVideoRef = useCallback(
    (node) => {
      videoRef.current = node
      if (node && stream) node.srcObject = stream
    },
    [stream, videoRef]
  )

  return (
    <main id="main-content" className="min-h-dvh bg-[#0B121B] flex flex-col px-4 py-6 gap-6 max-w-lg mx-auto">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={18} aria-hidden="true" />}
          onClick={() => navigate(-1)}
          ariaLabel="Go back to home"
        >
          Back
        </Button>
        <h1 className="font-display text-xl font-semibold text-[#E9EEF4]">Describe Scene</h1>
      </header>

      {/* Camera feed */}
      <div className="relative rounded-2xl overflow-hidden bg-[#161F2C] aspect-video flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#161F2C] z-10">
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
      </div>

      {/* Capture controls */}
      <div className="flex flex-col items-center gap-4">
        <CaptureButton onCapture={handleCapture} disabled={!stream || isLoading} isLoading={isPending} />

        <div className="flex gap-4">
          <VoiceButton onToggle={toggleListening} />
          {stream && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw size={16} aria-hidden="true" />}
              onClick={() => { stopCamera(); setTimeout(startCamera, 300) }}
              ariaLabel="Restart camera"
            >
              Restart
            </Button>
          )}
        </div>
        <CommandHUD />
      </div>

      {/* Captured frame preview */}
      <FramePreview imageDataUrl={capturedDataUrl} className="aspect-video" />

      {/* AI Description */}
      {(data || describeError) && (
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            {describeError && (
              <p role="alert" className="text-[#FF6B6B] font-body text-sm">
                {describeError.message ?? 'Failed to describe scene. Please try again.'}
              </p>
            )}
            {data?.description && (
              <>
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label="Scene description"
                  className={`text-[#E9EEF4] font-body leading-relaxed ${fontSizeClass}`}
                >
                  {data.description}
                </div>
                <div className="mt-3 flex gap-3">
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
            )}
          </Card>
        </motion.div>
      )}
    </main>
  )
}

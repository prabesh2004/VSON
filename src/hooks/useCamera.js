import { useState, useCallback, useRef, useEffect } from 'react'
import { MAX_IMAGE_SIZE_BYTES } from '@/lib/constants'

/**
 * @typedef {Object} UseCameraReturn
 * @property {MediaStream|null} stream
 * @property {boolean} isVideoReady
 * @property {boolean} isLoading
 * @property {number} startAttempts
 * @property {string|null} error
 * @property {string|null} capturedDataUrl
 * @property {string|null} capturedBase64
 * @property {(node: HTMLVideoElement|null) => void} setVideoElement
 * @property {() => Promise<boolean>} startCamera
 * @property {() => void} stopCamera
 * @property {() => string|null} captureFrame
 */

/**
 * @returns {UseCameraReturn}
 */
export const useCamera = () => {
  const [stream, setStream] = useState(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [startAttempts, setStartAttempts] = useState(0)
  const [error, setError] = useState(null)
  const [capturedDataUrl, setCapturedDataUrl] = useState(null)
  const [capturedBase64, setCapturedBase64] = useState(null)
  const streamRef = useRef(/** @type {MediaStream|null} */ (null))
  const startTokenRef = useRef(0)
  const mountedRef = useRef(true)
  const videoRef = useRef(null)
  const videoCleanupRef = useRef(null)
  const streamCleanupRef = useRef(null)
  const canvasRef = useRef(null)

  const stopTracks = (targetStream) => {
    targetStream?.getTracks().forEach((track) => track.stop())
  }

  const clearStreamListeners = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current()
      streamCleanupRef.current = null
    }
  }, [])

  const attachStreamListeners = useCallback(
    (nextStream) => {
      clearStreamListeners()

      const tracks = nextStream?.getVideoTracks?.() ?? []
      if (!tracks.length) return

      const onEnded = () => {
        if (streamRef.current !== nextStream) return

        streamRef.current = null
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        setStream(null)
        setIsVideoReady(false)
        setError('Camera stream stopped. This can happen with browser privacy policies. Tap Start Camera again.')
      }

      tracks.forEach((track) => {
        track.addEventListener('ended', onEnded)
        track.addEventListener('inactive', onEnded)
      })

      streamCleanupRef.current = () => {
        tracks.forEach((track) => {
          track.removeEventListener('ended', onEnded)
          track.removeEventListener('inactive', onEnded)
        })
      }
    },
    [clearStreamListeners]
  )

  const isLiveStream = useCallback((candidate) => {
    if (!candidate) return false
    const tracks = candidate.getVideoTracks?.() ?? []
    return tracks.some((track) => track.readyState === 'live')
  }, [])

  const detachVideoListeners = useCallback(() => {
    if (videoCleanupRef.current) {
      videoCleanupRef.current()
      videoCleanupRef.current = null
    }
  }, [])

  const bindVideo = useCallback((node, nextStream) => {
    if (!node || !nextStream) return

    const markReady = () => {
      setIsVideoReady(Boolean(node.videoWidth && node.videoHeight))
    }

    const markNotReady = () => {
      setIsVideoReady(false)
    }

    node.onloadedmetadata = () => {
      const playPromise = node.play?.()
      if (playPromise?.catch) {
        playPromise.catch(() => {
          // Playback can be blocked transiently until user interaction.
        })
      }
      markReady()
    }

    node.addEventListener('loadeddata', markReady)
    node.addEventListener('playing', markReady)
    node.addEventListener('emptied', markNotReady)

    node.srcObject = nextStream

    videoCleanupRef.current = () => {
      node.onloadedmetadata = null
      node.removeEventListener('loadeddata', markReady)
      node.removeEventListener('playing', markReady)
      node.removeEventListener('emptied', markNotReady)
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      startTokenRef.current += 1
      detachVideoListeners()
      clearStreamListeners()
      stopTracks(streamRef.current)
      streamRef.current = null
    }
  }, [clearStreamListeners, detachVideoListeners])

  const setVideoElement = useCallback((node) => {
    detachVideoListeners()

    videoRef.current = node
    setIsVideoReady(false)

    if (!node) return

    if (streamRef.current) {
      bindVideo(node, streamRef.current)
    }
  }, [bindVideo, detachVideoListeners])

  const startCamera = useCallback(async () => {
    const token = startTokenRef.current + 1
    startTokenRef.current = token
    let cameraStarted = false
    let didFail = false
    let wasSuperseded = false

    setError(null)
    setIsLoading(true)
    setIsVideoReady(false)
    setStartAttempts((count) => count + 1)
    try {
      if (streamRef.current && isLiveStream(streamRef.current)) {
        if (videoRef.current) {
          bindVideo(videoRef.current, streamRef.current)
        }
        setStream(streamRef.current)
        cameraStarted = true
      } else {
        if (streamRef.current) {
          stopTracks(streamRef.current)
          streamRef.current = null
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error('UNSUPPORTED_MEDIA_DEVICES')
        }

        let mediaStream
        const constraintAttempts = [
          { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: true, audio: false },
        ]

        let lastError
        for (const constraints of constraintAttempts) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
            break
          } catch (attemptError) {
            lastError = attemptError
          }
        }

        if (!mediaStream) {
          throw lastError ?? new Error('GET_USER_MEDIA_FAILED')
        }

        // If route changed or a newer start request exists, release this stream immediately.
        if (!mountedRef.current || startTokenRef.current !== token) {
          wasSuperseded = true
          stopTracks(mediaStream)
        } else {
          streamRef.current = mediaStream
          attachStreamListeners(mediaStream)
          setStream(mediaStream)
          cameraStarted = true

          if (videoRef.current) {
            bindVideo(videoRef.current, mediaStream)
          }
        }
      }
    } catch (err) {
      didFail = true
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera access in your browser settings.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : err?.name === 'NotReadableError'
          ? 'Camera is already in use by another app. Close other camera apps and try again.'
          : err?.message === 'UNSUPPORTED_MEDIA_DEVICES'
          ? 'Camera is unavailable in this browser/context. Use HTTPS or localhost with camera permission.'
          : `Could not start camera. ${err?.message ?? 'Please try again.'}`
      setError(msg)
    } finally {
      setIsLoading(false)

      const shouldFinalize = mountedRef.current && startTokenRef.current === token && !wasSuperseded
      if (shouldFinalize) {
        if (!cameraStarted && !didFail) {
          setError('Camera did not initialize. Tap Start Camera again.')
        }

        if (streamRef.current && isLiveStream(streamRef.current)) {
          setStream(streamRef.current)
        }
      }
    }

    return cameraStarted && !didFail && !wasSuperseded
  }, [attachStreamListeners, bindVideo, isLiveStream])

  const stopCamera = useCallback(() => {
    startTokenRef.current += 1
    detachVideoListeners()
    clearStreamListeners()
    stopTracks(streamRef.current)
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStream(null)
    setIsVideoReady(false)
    setError(null)
    setCapturedDataUrl(null)
    setCapturedBase64(null)
  }, [clearStreamListeners, detachVideoListeners])

  useEffect(() => {
    const recheckStream = () => {
      if (document.visibilityState !== 'visible') return
      if (streamRef.current && !isLiveStream(streamRef.current)) {
        stopTracks(streamRef.current)
        streamRef.current = null
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        setStream(null)
        setIsVideoReady(false)
      }
    }

    document.addEventListener('visibilitychange', recheckStream)
    window.addEventListener('focus', recheckStream)

    return () => {
      document.removeEventListener('visibilitychange', recheckStream)
      window.removeEventListener('focus', recheckStream)
    }
  }, [isLiveStream])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null

    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]

    if (base64.length > MAX_IMAGE_SIZE_BYTES * 1.37) {
      setError('Captured image is too large. Try reducing resolution.')
      return null
    }

    setCapturedDataUrl(dataUrl)
    setCapturedBase64(base64)
    return base64
  }, [])

  return {
    stream,
    isVideoReady,
    isLoading,
    startAttempts,
    error,
    capturedDataUrl,
    capturedBase64,
    videoRef,
    setVideoElement,
    startCamera,
    stopCamera,
    captureFrame,
  }
}

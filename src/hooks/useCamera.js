import { useState, useCallback, useRef, useEffect } from 'react'
import { canvasToBase64 } from '@/lib/utils'
import { MAX_IMAGE_SIZE_BYTES } from '@/lib/constants'

/**
 * @typedef {Object} UseCameraReturn
 * @property {MediaStream|null} stream
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {string|null} capturedDataUrl
 * @property {string|null} capturedBase64
 * @property {() => Promise<void>} startCamera
 * @property {() => void} stopCamera
 * @property {() => string|null} captureFrame
 */

/**
 * @returns {UseCameraReturn}
 */
export const useCamera = () => {
  const [stream, setStream] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [capturedDataUrl, setCapturedDataUrl] = useState(null)
  const [capturedBase64, setCapturedBase64] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(mediaStream)
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not start camera. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setCapturedDataUrl(null)
    setCapturedBase64(null)
  }, [stream])

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
    isLoading,
    error,
    capturedDataUrl,
    capturedBase64,
    videoRef,
    startCamera,
    stopCamera,
    captureFrame,
  }
}

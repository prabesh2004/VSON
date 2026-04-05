import { memo, useRef, useEffect } from 'react'
import { Spinner } from '@/components/ui/Spinner'

/**
 * @typedef {Object} CameraViewProps
 * @property {MediaStream|null} stream
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {string} [className]
 */

export const CameraView = memo(
  /**
   * @param {CameraViewProps} props
   */
  function CameraView({ stream, isLoading, error, className = '' }) {
    const videoRef = useRef(null)

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
      }
    }, [stream])

    return (
      <div
        className={[
          'relative overflow-hidden rounded-2xl bg-[#161F2C] aspect-video flex items-center justify-center',
          className,
        ].join(' ')}
        role="img"
        aria-label="Live camera view"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#161F2C] z-10">
            <Spinner size="lg" label="Starting camera…" />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
            <p className="text-[#FF6B6B] font-body font-medium" role="alert">
              {error}
            </p>
          </div>
        )}

        {!error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
        )}
      </div>
    )
  }
)

import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Camera } from 'lucide-react'

const _MOTION = motion

/**
 * @typedef {Object} CaptureButtonProps
 * @property {() => void} onCapture
 * @property {boolean} [disabled=false]
 * @property {boolean} [isLoading=false]
 * @property {string} [className]
 */

export const CaptureButton = memo(
  /**
   * @param {CaptureButtonProps} props
   */
  function CaptureButton({ onCapture, disabled = false, isLoading = false, className = '' }) {
    const prefersReduced = useReducedMotion()

    return (
      <motion.button
        onClick={onCapture}
        disabled={disabled || isLoading}
        aria-label={isLoading ? 'Analysing image…' : 'Capture and describe scene'}
        aria-busy={isLoading}
        whileTap={prefersReduced ? {} : { scale: 0.93 }}
        className={[
          'relative flex items-center justify-center rounded-full',
          'min-w-[72px] min-h-[72px] w-18 h-18',
          'bg-[#A9D1F5] text-[#0B121B]',
          'border-4 border-[#E9EEF4]/20',
          'shadow-lg hover:bg-[#93c4ef]',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B121B]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
      >
        {isLoading ? (
          <span
            aria-hidden="true"
            className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin"
          />
        ) : (
          <Camera size={28} aria-hidden="true" />
        )}
      </motion.button>
    )
  }
)

import { memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const _MOTION = motion

/**
 * @typedef {Object} FramePreviewProps
 * @property {string|null} imageDataUrl - base64 data URL of the captured frame
 * @property {string} [className]
 */

export const FramePreview = memo(
  /**
   * @param {FramePreviewProps} props
   */
  function FramePreview({ imageDataUrl, className = '' }) {
    const prefersReduced = useReducedMotion()

    return (
      <AnimatePresence>
        {imageDataUrl && (
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={[
              'overflow-hidden rounded-xl border-2 border-[#2F3C4C]',
              className,
            ].join(' ')}
          >
            <img
              src={imageDataUrl}
              alt="Captured frame to be described by AI"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

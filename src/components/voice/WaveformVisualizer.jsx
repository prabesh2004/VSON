import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useVoiceStore } from '@/store/useVoiceStore'

const BAR_COUNT = 12

/**
 * @typedef {Object} WaveformVisualizerProps
 * @property {string} [className]
 */

export const WaveformVisualizer = memo(
  /**
   * @param {WaveformVisualizerProps} props
   */
  function WaveformVisualizer({ className = '' }) {
    const prefersReduced = useReducedMotion()
    const { isListening, isSpeaking } = useVoiceStore()
    const isActive = isListening || isSpeaking

    return (
      <div
        aria-hidden="true"
        className={['flex items-center justify-center gap-1 h-10', className].join(' ')}
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <motion.span
            key={i}
            className={[
              'w-1 rounded-full',
              isListening ? 'bg-[#00D4AA]' : isSpeaking ? 'bg-[#A9D1F5]' : 'bg-[#7A8B9B]/40',
            ].join(' ')}
            animate={
              prefersReduced || !isActive
                ? { height: '8px' }
                : {
                    height: ['8px', `${12 + Math.random() * 24}px`, '8px'],
                    transition: {
                      repeat: Infinity,
                      duration: 0.4 + Math.random() * 0.4,
                      delay: (i / BAR_COUNT) * 0.3,
                      ease: 'easeInOut',
                    },
                  }
            }
          />
        ))}
      </div>
    )
  }
)

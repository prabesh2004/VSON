import { memo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useVoiceStore } from '@/store/useVoiceStore'

const _MOTION = motion

/**
 * @typedef {Object} CommandHUDProps
 * @property {string} [className]
 */

export const CommandHUD = memo(
  /**
   * @param {CommandHUDProps} props
   */
  function CommandHUD({ className = '' }) {
    const prefersReduced = useReducedMotion()
    const { lastCommand, liveTranscript, isListening, isProcessing, commandStatus, commandFeedback, voiceError } =
      useVoiceStore()

    const displayText =
      voiceError ||
      (isListening && liveTranscript ? `Heard: ${liveTranscript}` : null) ||
      commandFeedback ||
      (isProcessing ? 'Processing command...' : null) ||
      lastCommand

    const dotClass =
      commandStatus === 'failed'
        ? 'bg-[#FF6B6B]'
        : commandStatus === 'unsupported'
        ? 'bg-[#FFB347]'
        : commandStatus === 'executed'
        ? 'bg-[#00D4AA]'
        : commandStatus === 'recognized'
        ? 'bg-[#A9D1F5]'
        : isListening
        ? 'bg-[#00D4AA] animate-pulse'
        : 'bg-[#A9D1F5]'

    return (
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-label="Voice command feedback"
        className={['pointer-events-none', className].join(' ')}
      >
        <AnimatePresence mode="wait">
          {displayText && (
            <motion.div
              key={displayText}
              initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#161F2C] border border-[#2F3C4C] rounded-2xl shadow-lg"
            >
              <span
                aria-hidden="true"
                className={['w-2 h-2 rounded-full flex-shrink-0', dotClass].join(' ')}
              />
              <p className="text-[#E9EEF4] font-body text-sm font-medium truncate max-w-[calc(100vw-96px)] sm:max-w-xs">
                {displayText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

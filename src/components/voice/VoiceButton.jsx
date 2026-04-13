import { memo, useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceStore } from '@/store/useVoiceStore'

const _MOTION = motion

/**
 * @typedef {Object} VoiceButtonProps
 * @property {() => void} onToggle
 * @property {string} [className]
 * @property {boolean} [compact=false]
 * @property {boolean} [hideStatus=false]
 */

export const VoiceButton = memo(
  /**
   * @param {VoiceButtonProps} props
   */
  function VoiceButton({ onToggle, className = '', compact = false, hideStatus = false }) {
    const prefersReduced = useReducedMotion()
    const { isListening, isProcessing } = useVoiceStore()
    const statusId = useId()

    const isIdle = !isListening && !isProcessing
    const iconSize = compact ? 20 : 32

    const label = isProcessing
      ? 'Processing voice command'
      : isListening
      ? 'Stop listening'
      : 'Start voice command'

    const statusText = isProcessing ? 'Processing…' : isListening ? 'Listening…' : 'Tap to speak'

    const statusClass = [
      'text-sm font-body font-medium',
      isListening ? 'text-[#00D4AA]' : isIdle ? 'text-[#7A8B9B]' : 'text-[#A9D1F5]',
    ].join(' ')

    return (
      <div className={hideStatus ? 'flex items-center' : 'flex flex-col items-center gap-3'}>
        <motion.button
          onClick={onToggle}
          disabled={isProcessing}
          aria-label={label}
          aria-describedby={statusId}
          aria-pressed={isListening}
          animate={
            prefersReduced
              ? {}
              : isListening
              ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } }
              : { scale: 1 }
          }
          whileTap={prefersReduced ? {} : { scale: 0.95 }}
          className={[
            'relative flex items-center justify-center rounded-full',
            compact ? 'min-w-[48px] min-h-[48px] w-12 h-12' : 'min-w-[80px] min-h-[80px] w-20 h-20',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B121B]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            isListening
              ? 'bg-[#00D4AA] text-[#0B121B] shadow-[0_0_30px_rgba(0,212,170,0.4)]'
              : 'bg-[#161F2C] border-2 border-[#A9D1F5] text-[#A9D1F5] hover:bg-[#A9D1F5]/10',
            className,
          ].join(' ')}
        >
          {/* Pulse ring when listening */}
          {isListening && !prefersReduced && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[#00D4AA]/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
            />
          )}

          {isProcessing ? (
            <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
          ) : isListening ? (
            <MicOff size={iconSize} aria-hidden="true" />
          ) : (
            <Mic size={iconSize} aria-hidden="true" />
          )}
        </motion.button>

        <span
          id={statusId}
          aria-live="polite"
          aria-atomic="true"
          className={hideStatus ? 'sr-only' : statusClass}
        >
          {statusText}
        </span>
      </div>
    )
  }
)

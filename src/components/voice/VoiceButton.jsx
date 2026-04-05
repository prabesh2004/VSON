import { memo, useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceStore } from '@/store/useVoiceStore'

/**
 * @typedef {Object} VoiceButtonProps
 * @property {() => void} onToggle
 * @property {string} [className]
 */

export const VoiceButton = memo(
  /**
   * @param {VoiceButtonProps} props
   */
  function VoiceButton({ onToggle, className = '' }) {
    const prefersReduced = useReducedMotion()
    const { isListening, isProcessing, isSpeaking } = useVoiceStore()
    const statusId = useId()

    const isActive = isListening || isSpeaking
    const isIdle = !isListening && !isProcessing && !isSpeaking

    const label = isProcessing
      ? 'Processing voice command'
      : isListening
      ? 'Stop listening'
      : isSpeaking
      ? 'Vision is speaking'
      : 'Start voice command'

    return (
      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={onToggle}
          disabled={isProcessing || isSpeaking}
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
            'min-w-[80px] min-h-[80px] w-20 h-20',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B121B]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            isListening
              ? 'bg-[#00D4AA] text-[#0B121B] shadow-[0_0_30px_rgba(0,212,170,0.4)]'
              : isActive
              ? 'bg-[#A9D1F5] text-[#0B121B]'
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
            <Loader2 size={32} className="animate-spin" aria-hidden="true" />
          ) : isListening ? (
            <MicOff size={32} aria-hidden="true" />
          ) : (
            <Mic size={32} aria-hidden="true" />
          )}
        </motion.button>

        <span
          id={statusId}
          aria-live="polite"
          aria-atomic="true"
          className={[
            'text-sm font-body font-medium',
            isListening ? 'text-[#00D4AA]' : isIdle ? 'text-[#7A8B9B]' : 'text-[#A9D1F5]',
          ].join(' ')}
        >
          {isProcessing
            ? 'Processing…'
            : isListening
            ? 'Listening…'
            : isSpeaking
            ? 'Speaking…'
            : 'Tap to speak'}
        </span>
      </div>
    )
  }
)

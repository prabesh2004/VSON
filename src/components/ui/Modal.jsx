import { useCallback, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

const _MOTION = motion

/**
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {string} title
 * @property {React.ReactNode} children
 * @property {string} [className]
 */

export const Modal = memo(
  /**
   * @param {ModalProps} props
   */
  function Modal({ isOpen, onClose, title, children, className = '' }) {
    const prefersReduced = useReducedMotion()
    const overlayRef = useRef(null)
    const firstFocusableRef = useRef(null)

    const trapFocus = useCallback((e) => {
      const modal = overlayRef.current?.querySelector('[role="dialog"]')
      if (!modal) return
      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault()
        ;(e.shiftKey ? last : first)?.focus()
      }
    }, [])

    useEffect(() => {
      if (!isOpen) return

      const previouslyFocused = document.activeElement
      firstFocusableRef.current?.focus()

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Tab') trapFocus(e)
      }

      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
        previouslyFocused?.focus()
      }
    }, [isOpen, onClose, trapFocus])

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === overlayRef.current && onClose()}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={prefersReduced ? {} : { scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={prefersReduced ? {} : { scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={[
                'relative bg-[#161F2C] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto',
                className,
              ].join(' ')}
            >
              <div className="flex items-center justify-between p-6 border-b border-[#2F3C4C]">
                <h2
                  id="modal-title"
                  className="text-xl font-display font-semibold text-[#E9EEF4]"
                >
                  {title}
                </h2>
                <button
                  ref={firstFocusableRef}
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-2 rounded-lg text-[#7A8B9B] hover:text-[#E9EEF4] hover:bg-[#A9D1F5]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5]"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="p-6">{children}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)

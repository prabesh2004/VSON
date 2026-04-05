import { memo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { FONT_SIZE_CLASSES } from '@/lib/constants'

/**
 * @typedef {Object} TextDisplayProps
 * @property {string} text
 * @property {string} [title]
 * @property {string} [className]
 */

export const TextDisplay = memo(
  /**
   * @param {TextDisplayProps} props
   */
  function TextDisplay({ text, title, className = '' }) {
    const { fontSize } = useAppStore()
    const fontSizeClass = FONT_SIZE_CLASSES[fontSize] ?? 'text-base'

    return (
      <article
        aria-label={title ? `Content: ${title}` : 'Content'}
        className={['bg-[#161F2C] rounded-2xl p-6', className].join(' ')}
      >
        {title && (
          <h2 className="font-display font-semibold text-[#E9EEF4] text-xl mb-4 leading-snug">
            {title}
          </h2>
        )}
        <div
          aria-live="polite"
          aria-atomic="false"
          className={[
            'text-[#E9EEF4] font-body leading-relaxed whitespace-pre-wrap',
            fontSizeClass,
          ].join(' ')}
        >
          {text}
        </div>
      </article>
    )
  }
)

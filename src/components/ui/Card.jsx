import { memo } from 'react'

/**
 * @typedef {Object} CardProps
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {string} [ariaLabel]
 * @property {boolean} [interactive=false] - adds hover/focus styling if true
 * @property {() => void} [onClick]
 */

export const Card = memo(
  /**
   * @param {CardProps} props
   */
  function Card({ children, className = '', ariaLabel, interactive = false, onClick }) {
    const Tag = interactive ? 'button' : 'div'

    return (
      <Tag
        onClick={onClick}
        aria-label={interactive ? ariaLabel : undefined}
        className={[
          'bg-[#161F2C] border border-[#2F3C4C] rounded-2xl p-6',
          interactive
            ? 'cursor-pointer transition-colors duration-150 hover:bg-[#1c2838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B] text-left w-full'
            : '',
          className,
        ].join(' ')}
      >
        {children}
      </Tag>
    )
  }
)

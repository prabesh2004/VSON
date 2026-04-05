import { memo } from 'react'

/**
 * @typedef {'sm'|'md'|'lg'} SpinnerSize
 *
 * @typedef {Object} SpinnerProps
 * @property {SpinnerSize} [size='md']
 * @property {string} [label='Loading…']
 * @property {string} [className]
 */

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-14 h-14 border-4',
}

export const Spinner = memo(
  /**
   * @param {SpinnerProps} props
   */
  function Spinner({ size = 'md', label = 'Loading…', className = '' }) {
    return (
      <div
        role="status"
        aria-label={label}
        aria-busy="true"
        className={['flex items-center justify-center', className].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'rounded-full border-[#A9D1F5] border-t-transparent animate-spin',
            sizeClasses[size],
          ].join(' ')}
        />
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)

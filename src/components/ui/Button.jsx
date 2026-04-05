import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const _MOTION = motion

/**
 * @typedef {'primary'|'secondary'|'ghost'|'danger'} ButtonVariant
 * @typedef {'sm'|'md'|'lg'} ButtonSize
 *
 * @typedef {Object} ButtonProps
 * @property {ButtonVariant} [variant='primary']
 * @property {ButtonSize} [size='md']
 * @property {boolean} [isLoading=false]
 * @property {boolean} [disabled=false]
 * @property {string} [ariaLabel]
 * @property {React.ReactNode} [children]
 * @property {React.ReactNode} [leftIcon]
 * @property {React.ReactNode} [rightIcon]
 * @property {string} [className]
 * @property {() => void} [onClick]
 * @property {'button'|'submit'|'reset'} [type='button']
 */

const variantClasses = {
  primary:
    'bg-[#A9D1F5] text-[#0B121B] hover:bg-[#93c4ef] active:bg-[#7eb8e8]',
  secondary:
    'bg-[#161F2C] text-[#E9EEF4] border border-[#2F3C4C] hover:bg-[#1c2838] active:bg-[#243044]',
  ghost:
    'bg-transparent text-[#7A8B9B] hover:text-[#E9EEF4] hover:bg-[#161F2C] active:bg-[#161F2C]/80',
  danger:
    'bg-[#FF6B6B] text-[#E9EEF4] hover:bg-[#e55a5a] active:bg-[#cc4a4a]',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm min-h-[48px] min-w-[48px]',
  md: 'px-5 py-2.5 text-base min-h-[48px] min-w-[48px]',
  lg: 'px-7 py-3.5 text-lg min-h-[56px] min-w-[56px]',
}

export const Button = memo(
  /**
   * @param {ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>} props
   */
  function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    ariaLabel,
    children,
    leftIcon,
    rightIcon,
    className = '',
    onClick,
    type = 'button',
    ...rest
  }) {
    const prefersReduced = useReducedMotion()
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        whileTap={prefersReduced ? {} : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-xl font-body font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...rest}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    )
  }
)

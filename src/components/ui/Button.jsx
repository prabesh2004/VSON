import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

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

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md font-body font-medium whitespace-nowrap select-none',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-10 min-w-10 px-3 text-sm',
        md: 'h-11 min-w-11 px-4 text-sm',
        lg: 'h-12 min-w-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

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
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span data-icon="inline-start" aria-hidden="true">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon ? <span data-icon="inline-end" aria-hidden="true">{rightIcon}</span> : null}
      </motion.button>
    )
  }
)

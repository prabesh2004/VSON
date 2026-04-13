import { memo } from 'react'
import { cn } from '@/lib/utils'

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
        type={interactive ? 'button' : undefined}
        onClick={onClick}
        aria-label={interactive ? ariaLabel : undefined}
        className={cn(
          'rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm',
          interactive
            ? 'w-full cursor-pointer text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            : '',
          className
        )}
      >
        {children}
      </Tag>
    )
  }
)

export const CardHeader = memo(function CardHeader({ children, className = '' }) {
  return <div className={cn('flex flex-col gap-1.5 pb-4', className)}>{children}</div>
})

export const CardTitle = memo(function CardTitle({ children, className = '' }) {
  return <h3 className={cn('font-display text-lg font-semibold leading-none tracking-tight', className)}>{children}</h3>
})

export const CardDescription = memo(function CardDescription({ children, className = '' }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
})

export const CardContent = memo(function CardContent({ children, className = '' }) {
  return <div className={cn('', className)}>{children}</div>
})

export const CardFooter = memo(function CardFooter({ children, className = '' }) {
  return <div className={cn('flex items-center pt-4', className)}>{children}</div>
})

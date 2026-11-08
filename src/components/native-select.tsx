import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// The browser's own select, styled like an Input: a phone opens its native picker, and it costs no JavaScript
export function NativeSelect({
  className,
  icon,
  children,
  ...props
}: ComponentProps<'select'> & { icon?: ReactNode }) {
  return (
    <span className={cn('relative flex', className)}>
      {icon && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground [&>svg]:size-4"
        >
          {icon}
        </span>
      )}
      <select
        {...props}
        className={cn(
          'h-11 w-full min-w-0 appearance-none truncate rounded-lg border border-input bg-card pr-9 pl-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm',
          icon && 'pl-9',
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  )
}

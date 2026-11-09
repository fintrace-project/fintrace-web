import { cloneElement, isValidElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// A labelled form control with the message Core gave for that field, when it refused one
export function Field({
  id,
  label,
  error,
  hideLabel,
  children,
}: {
  id: string
  label: ReactNode
  error?: string
  // For a control that shows what it is by itself; the label stays for screen readers
  hideLabel?: boolean
  children: ReactNode
}) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className={cn('text-caption font-normal text-muted-foreground', hideLabel && 'sr-only')}
      >
        {label}
      </Label>
      {error && isValidElement<{ 'aria-describedby'?: string }>(children)
        ? cloneElement(children, { 'aria-describedby': errorId })
        : children}
      {error && (
        <span id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}

import type { ReactNode } from 'react'
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
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className={cn('text-[13px] font-normal text-muted-foreground', hideLabel && 'sr-only')}
      >
        {label}
      </Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

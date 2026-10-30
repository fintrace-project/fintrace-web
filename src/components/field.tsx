import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

// A labelled form control with the message Core gave for that field, when it refused one
export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

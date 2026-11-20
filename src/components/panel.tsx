import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-5', className)}>
      <div className="flex min-h-9 items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Pending({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

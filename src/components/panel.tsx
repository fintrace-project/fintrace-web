import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  action,
  footer,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  // A link under the content, such as "All statistics →", a full 44 px touch target
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-2xl border bg-card px-5 py-3', className)}>
      {/* No height of its own: an action's touch target overlaps the padding, so the title sits 12 px from the edge */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
      {/* The footer's touch target holds 13 px around its text: pulled in by those, less 2 above, so its text sits
          10 px under the content and 12 px over the edge in every panel */}
      {footer && <div className="-mt-[15px] -mb-[13px] flex">{footer}</div>}
    </section>
  )
}

export function Pending({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

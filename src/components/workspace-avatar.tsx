import { initials } from '@/core/format'
import { cn } from '@/lib/utils'

export function WorkspaceAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

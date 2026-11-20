import { initials } from '@/core/format'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

// An account's or a category's own colour, picked by its id; the workspace's accent stays with the page around it
export function InitialsAvatar({
  name,
  colorId,
  className,
}: {
  name: string
  colorId: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={accentOf(colorId)}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-control bg-(--ws-soft) text-caption font-extrabold text-(--ws)',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

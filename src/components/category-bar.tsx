import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

export interface Segment {
  key: string
  total: number
  // The category whose colour it takes; none for Core's "other", which stays muted
  colorId?: string
}

const fill = (colorId?: string) => (colorId ? 'bg-(--ws)' : 'bg-muted-foreground/30')

// Each segment sized by its own total through flex-grow, so the browser divides the bar and no share is
// computed here; an empty bar when there are none
export function CategoryBar({ segments }: { segments: Segment[] }) {
  if (segments.length === 0) {
    return <div aria-hidden className="h-1.5 rounded-full bg-muted" />
  }
  return (
    <div aria-hidden className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
      {segments.map((segment) => (
        <span
          key={segment.key}
          style={{ ...(segment.colorId && accentOf(segment.colorId)), flexGrow: segment.total }}
          className={cn('basis-0', fill(segment.colorId))}
        />
      ))}
    </div>
  )
}

// A row under the bar, led by the category's icon or, without one, a dot in the segment's colour; with onOpen the
// whole row is a button leading one level down. In a list that drills, every row is a touch target's height and
// keeps the chevron's column, so the figures line up whether a row opens or not.
export function CategoryRow({
  label,
  amount,
  colorId,
  icon,
  onOpen,
  drillList = false,
}: {
  label: string
  amount: string
  colorId?: string
  icon?: ReactNode
  onOpen?: () => void
  drillList?: boolean
}) {
  const row = cn(
    'flex items-center gap-2',
    drillList && '-mx-2 min-h-11 w-[calc(100%+1rem)] rounded-control px-2 md:min-h-9',
  )
  const content = (
    <>
      {icon ?? (
        <span
          aria-hidden
          style={colorId ? accentOf(colorId) : undefined}
          className={cn('size-2 shrink-0 rounded-full', fill(colorId))}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="whitespace-nowrap tabular-nums">{amount}</span>
      {drillList &&
        (onOpen ? (
          <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <span aria-hidden className="size-4 shrink-0" />
        ))}
    </>
  )
  return (
    <li>
      {onOpen ? (
        <button type="button" onClick={onOpen} className={cn(row, 'text-left hover:bg-muted')}>
          {content}
        </button>
      ) : (
        <div className={row}>{content}</div>
      )}
    </li>
  )
}

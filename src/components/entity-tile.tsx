import { ChevronUp, Ellipsis, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon, type Iconed } from '@/components/entity-icon'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const tileClass =
  'flex min-w-0 flex-col items-center gap-1 rounded-xl py-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

// Chosen, a full ring; on the way to the chosen one (its parent, say), a soft one
export type Ring = 'full' | 'soft' | 'none'

// A round icon with the name below in up to two lines, and an optional line under it
export function EntityTile({
  entity,
  ring,
  sub,
  onClick,
}: {
  entity: Iconed
  ring: Ring
  sub?: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" aria-pressed={ring === 'full'} onClick={onClick} className={tileClass}>
      {/* The ring is the wrapper's: the icon sets its own colour as --ws, the wrapper still sees the
          workspace's, which marks a choice everywhere in the form */}
      <span
        className={cn(
          'rounded-full p-0.5 ring-2 ring-transparent transition-shadow',
          ring === 'full' && 'ring-(--ws)',
          ring === 'soft' && 'ring-(--ws)/35',
        )}
      >
        <EntityIcon entity={entity} className="size-13 rounded-full text-sm" />
      </span>
      <TileName selected={ring !== 'none'}>{entity.name}</TileName>
      {sub && (
        <span className="-mt-1 w-full truncate text-center text-[11px] leading-tight text-muted-foreground tabular-nums">
          {sub}
        </span>
      )}
    </button>
  )
}

// A card's heading on the left and its search on the right, one line; typing turns the card's grid into
// the matches
export function CardHeader({
  title,
  search,
  onSearch,
  label,
}: {
  title: string
  search: string
  onSearch: (search: string) => void
  // What a screen reader hears; seen, the hint is only "Search"
  label: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="shrink-0 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {/* As long as the heading leaves room for */}
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label={label}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={t('operations.form.search')}
          autoComplete="off"
          className="h-8 rounded-full border-transparent bg-(--ws-soft) pr-3 pl-8 text-sm md:text-sm"
        />
      </div>
    </div>
  )
}

// The last tile of a grid showing only the recent few: More opens the rest in place, Less folds it back
export function MoreTile({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  return (
    <button type="button" aria-expanded={expanded} onClick={onToggle} className={tileClass}>
      <span className="flex size-14 items-center justify-center rounded-full bg-(--ws-soft) text-muted-foreground">
        {expanded ? (
          <ChevronUp aria-hidden className="size-5" />
        ) : (
          <Ellipsis aria-hidden className="size-5" />
        )}
      </span>
      <TileName>{t(expanded ? 'operations.form.less' : 'operations.form.more')}</TileName>
    </button>
  )
}

// Two lines at most. No room is kept for a second: tiles sit at the top of their row, so a longer name only
// makes its row taller
export function TileName({ selected, children }: { selected?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'line-clamp-2 w-full text-center text-[11px] leading-tight break-words',
        selected && 'font-semibold',
      )}
    >
      {children}
    </span>
  )
}

// A grid of tiles laid out as the card's own, under a caption; `divided` when it follows something else in the
// same card
export function TileGroup({
  caption,
  divided,
  children,
}: {
  caption: ReactNode
  divided?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-2', divided && 'border-t pt-3')}>
      <span className="flex min-w-0 items-center gap-0.5 px-1 text-xs font-medium text-muted-foreground">
        {caption}
      </span>
      <div className="grid grid-cols-4 gap-x-2 gap-y-2">{children}</div>
    </div>
  )
}

import { ChevronRight, Ellipsis } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CategorySearch, Path } from '@/components/category-picker'
import { EntityIcon } from '@/components/entity-icon'
import type { Category, CategoryKind } from '@/core/api'
import { categoryPath, childOnPath, childrenOf, topLevelCategories, topLevelOf } from '@/core/categories'
import { recentCategoryIds } from '@/core/recent'
import { useWorkspaceFeed } from '@/hooks/use-feed'
import { cn } from '@/lib/utils'

// Two rows of four, the last tile being More
const TILES = 7
// Enough of the feed's history to rank the top level by
const RECENT = 50

const tile =
  'flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

// The branch's top level as round tiles, the recently used first, More opening the whole tree; under it, the
// chosen one's children as a row of smaller tiles
export function CategoryGrid({
  workspaceId,
  categories,
  kind,
  value,
  onChange,
}: {
  workspaceId: string
  categories: Category[]
  kind: CategoryKind
  value: string
  onChange: (categoryId: string) => void
}) {
  const { t } = useTranslation()
  const feed = useWorkspaceFeed(workspaceId)

  const recent = recentCategoryIds(feed.data?.pages.flatMap((page) => page.items) ?? [], kind, RECENT)
  const top = topLevelCategories(categories, kind, recent)
  const selectedTop = topLevelOf(categories, value)
  // One picked through More stays in view, in the last tile's place
  const shown = top.slice(0, TILES)
  const tiles =
    selectedTop && !shown.some((category) => category.id === selectedTop.id)
      ? [...shown.slice(0, TILES - 1), selectedTop]
      : shown

  const children = selectedTop ? childrenOf(categories, selectedTop.id) : []
  const onPath = selectedTop && childOnPath(categories, selectedTop.id, value)
  const deeper = onPath !== undefined && onPath.id !== value

  return (
    // A white card on the dialog's tint, as content is on the pages
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3">
      <h3 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t('operations.form.category')}
      </h3>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {/* The top level's own tile is its "all": chosen itself, a full ring; a child of it chosen, a soft one */}
        {tiles.map((category) => (
          <CategoryTile
            key={category.id}
            category={category}
            ring={category.id !== selectedTop?.id ? 'none' : value === category.id ? 'full' : 'soft'}
            onClick={() => onChange(category.id)}
          />
        ))}
        <CategorySearch
          workspaceId={workspaceId}
          categories={categories}
          kind={kind}
          value={value}
          onChoose={onChange}
          trigger={
            <button type="button" className={tile}>
              <span className="flex size-14 items-center justify-center rounded-full bg-(--ws-soft) text-muted-foreground">
                <Ellipsis aria-hidden className="size-5" />
              </span>
              <TileName>{t('operations.form.more')}</TileName>
            </button>
          }
        />
      </div>

      {/* The chosen one's children: one row of smaller tiles scrolling sideways, so however many there
          are the card keeps its height, and the second level reads as second */}
      {selectedTop && children.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="flex min-w-0 items-center gap-0.5 px-1 text-xs font-medium text-muted-foreground">
            <span className="truncate">{selectedTop.name}</span>
            <ChevronRight aria-hidden className="size-3 shrink-0" />
          </span>
          <div className="-mx-3 flex gap-1 overflow-x-auto px-3 [scrollbar-width:none]">
            {children.map((child) => (
              <CategoryTile
                key={child.id}
                category={child}
                ring={child.id === onPath?.id ? 'full' : 'none'}
                small
                onClick={() => onChange(child.id)}
              />
            ))}
          </div>
          {/* A category deeper than the tiles reach, picked through More, says where it sits */}
          {deeper && (
            <span className="truncate px-1 text-xs">
              <Path names={categoryPath(categories, value)} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// A round icon with the name below, in up to two lines; chosen, a ring in the workspace's colour
function CategoryTile({
  category,
  ring,
  small,
  onClick,
}: {
  category: Category
  ring: 'full' | 'soft' | 'none'
  small?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={ring === 'full'}
      onClick={onClick}
      className={cn(tile, small && 'w-18 shrink-0')}
    >
      {/* The ring is the wrapper's: the icon sets its own colour as --ws, the wrapper still sees the
          workspace's, which marks a choice everywhere in the form */}
      <span
        className={cn(
          'rounded-full p-0.5 ring-2 ring-transparent transition-shadow',
          ring === 'full' && 'ring-(--ws)',
          ring === 'soft' && 'ring-(--ws)/35',
        )}
      >
        <EntityIcon
          entity={category}
          className={cn('rounded-full', small ? 'size-10 text-xs' : 'size-13 text-sm')}
        />
      </span>
      <TileName selected={ring !== 'none'}>{category.name}</TileName>
    </button>
  )
}

// Two lines at most, both kept for every tile, so the tiles of a row line up whatever their names' length
function TileName({ selected, children }: { selected?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'line-clamp-2 min-h-[2lh] w-full text-center text-[11px] leading-tight break-words',
        selected && 'font-semibold',
      )}
    >
      {children}
    </span>
  )
}

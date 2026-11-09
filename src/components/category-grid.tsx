import { ChevronRight } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CardHeader, EntityTile, MoreTile, TileGroup, type Ring } from '@/components/entity-tile'
import type { Category, CategoryKind } from '@/core/api'
import {
  childrenOf,
  lineage,
  searchCategories,
  topLevelCategories,
  type CategorySearch,
} from '@/core/categories'
import { recentCategoryIds, withChosen } from '@/core/recent'
import { useWorkspaceFeed } from '@/hooks/use-feed'

// Two rows of four, the last tile being More
const TILES = 7
// Enough of the feed's history to rank the top level by
const RECENT = 50

// Everything in place, on one white card: the branch's top level as tiles, the recently used first; More
// opens the whole top level, the search beside the heading finds any depth; under the grid, after a divider,
// a group of children for each level on the way down to the chosen category
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
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  const recent = recentCategoryIds(feed.data?.pages.flatMap((page) => page.items) ?? [], kind, RECENT)
  const top = topLevelCategories(categories, kind, recent)
  const chain = lineage(categories, value)
  const onChain = new Set(chain.map((category) => category.id))
  const ringOf = (category: Category): Ring =>
    category.id === value ? 'full' : onChain.has(category.id) ? 'soft' : 'none'

  // One picked deeper or through the search stays in view
  const tiles = withChosen(top, chain[0], TILES)

  const query = search.trim()
  const found = searchCategories(categories, kind, query)
  const levels = chain.filter((category) => childrenOf(categories, category.id).length > 0)

  // A choice in the grid or the search folds it back to the recent few
  const choose = (categoryId: string) => {
    onChange(categoryId)
    setExpanded(false)
    setSearch('')
  }
  const toggle = () => {
    setExpanded(!expanded)
    setSearch('')
  }
  const tileOn = (pick: (categoryId: string) => void) => (category: Category) => (
    <EntityTile
      key={category.id}
      entity={category}
      ring={ringOf(category)}
      badge={<ChildBadge categories={categories} category={category} />}
      onClick={() => pick(category.id)}
    />
  )
  const tile = tileOn(choose)

  return (
    // A white card on the dialog's tint, as content is on the pages
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3">
      <CardHeader
        title={t('operations.form.category')}
        search={search}
        onSearch={setSearch}
        label={t('operations.form.searchCategories')}
      />
      <div className="grid grid-cols-4 gap-x-2 gap-y-2 empty:hidden">
        {query ? found.top.map(tile) : (expanded ? top : tiles).map(tile)}
        {!query && <MoreTile expanded={expanded} onToggle={toggle} />}
      </div>
      <FoundGroups found={found} tile={tile} />
      {query && found.top.length === 0 && found.below.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">{t('operations.form.noCategory')}</p>
      )}

      {/* Folded, the way down: each level on the chosen path that has children gets a group of them */}
      {!expanded &&
        !query &&
        levels.map((parent) => (
          <TileGroup
            key={parent.id}
            divided
            caption={
              <>
                <span className="truncate">{parent.name}</span>
                <ChevronRight aria-hidden className="size-3 shrink-0" />
              </>
            }
          >
            {childrenOf(categories, parent.id).map(tileOn(onChange))}
          </TileGroup>
        ))}
    </div>
  )
}

// How many subcategories a tile opens, on its icon's corner; nothing on a leaf
export function ChildBadge({ categories, category }: { categories: Category[]; category: Category }) {
  const { t } = useTranslation()
  const count = childrenOf(categories, category.id).length
  if (count === 0) {
    return null
  }
  return (
    <span className="absolute -right-1 -bottom-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-foreground tabular-nums ring-2 ring-card">
      <span aria-hidden>{count}</span>
      <span className="sr-only">{t('categories.childCount', { count })}</span>
    </span>
  )
}

// A search's deeper matches, a group per parent, following the grid of its top-level ones
export function FoundGroups({
  found,
  tile,
}: {
  found: CategorySearch
  tile: (category: Category) => ReactNode
}) {
  return found.below.map(({ parentId, path, matches }, index) => (
    <TileGroup
      key={parentId}
      divided={found.top.length > 0 || index > 0}
      caption={
        <>
          <span className="truncate">
            <Path names={path} />
          </span>
          <ChevronRight aria-hidden className="size-3 shrink-0" />
        </>
      }
    >
      {matches.map(tile)}
    </TileGroup>
  ))
}

// Names joined by chevrons
function Path({ names }: { names: string[] }) {
  return names.map((name, index) => (
    <Fragment key={index}>
      {index > 0 && <ChevronRight aria-hidden className="mx-0.5 inline size-3" />}
      {name}
    </Fragment>
  ))
}

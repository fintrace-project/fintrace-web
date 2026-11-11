import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { Pending } from '@/components/cards'
import { AddCategoryTile, ArchivedCategories, CategoryMenu } from '@/components/category-actions'
import { ChildBadge, FoundGroups } from '@/components/category-grid'
import { CardHeader, EntityTile, TileGroup, type Ring } from '@/components/entity-tile'
import { KindToggle } from '@/components/form-header'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import type { Category, CategoryKind, Workspace } from '@/core/api'
import { childrenOf, lineage, rootOf, searchCategories } from '@/core/categories'
import { useCategories } from '@/hooks/use-categories'
import { useLongPress } from '@/hooks/use-long-press'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

const BRANCHES: CategoryKind[] = ['EXPENSE', 'INCOME']
// TileGroup's and this page's grid-cols-4
const COLUMNS = 4

export function CategoriesPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  const { data: categories, error, refetch } = useCategories(workspaceId)
  const [params, setParams] = useSearchParams()
  const [chosenKind, setChosenKind] = useState<CategoryKind>('EXPENSE')
  const { t } = useTranslation()

  const selectedId = params.get('category')
  const opened = categories?.find((each) => each.id === selectedId && each.parentId && !each.archived)
  const kind = opened?.kind ?? chosenKind
  // In the URL, so the phone's back gesture walks back up the tree
  const open = (id: string | null) => setParams(id ? { category: id } : {})

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('sections.categories')}
        actions={
          // A wide screen shows both branches, so there is nothing to switch
          <div className="md:hidden">
            <KindToggle
              value={kind}
              onChange={(next) => {
                setChosenKind(next)
                open(null)
              }}
              kinds={BRANCHES}
            />
          </div>
        }
      />
      {error ? (
        <LoadError title={t('errors.loadCategories')} error={error} onRetry={() => void refetch()} />
      ) : !categories ? (
        <Pending>{t('common.loading')}</Pending>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {BRANCHES.map((branch) => (
            <div key={branch} className={cn('min-w-0', branch !== kind && 'hidden md:block')}>
              <CategoryBrowser
                workspace={workspace}
                categories={categories}
                kind={branch}
                opened={opened?.kind === branch ? opened : undefined}
                open={open}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// The menu sits beside the tile, not in it: a button cannot hold another
function ManagedTile({
  category,
  categories,
  ring,
  editable,
  onClick,
  onArchived,
}: {
  category: Category
  categories: Category[]
  ring: Ring
  editable: boolean
  onClick: () => void
  onArchived: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const press = useLongPress(() => setMenuOpen(true))

  return (
    <div
      className="relative grid min-w-0 select-none [-webkit-touch-callout:none]"
      {...(editable ? press : undefined)}
    >
      <EntityTile
        entity={category}
        ring={ring}
        large
        badge={<ChildBadge count={childrenOf(categories, category.id).length} />}
        onClick={onClick}
      />
      {editable && (
        <CategoryMenu
          category={category}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onArchived={onArchived}
        />
      )}
    </div>
  )
}

// One card, as the operation form's picker: the branch's top level as tiles and, under it, a group for each
// level on the way down to the chosen category. Unlike the picker it shows everything in reading order, since
// a list being tidied should not hide or reorder itself by use
function CategoryBrowser({
  workspace,
  categories,
  kind,
  opened,
  open,
}: {
  workspace: Workspace
  categories: Category[]
  kind: CategoryKind
  opened: Category | undefined
  open: (id: string | null) => void
}) {
  const [search, setSearch] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const openedId = opened?.id

  useEffect(() => {
    if (openedId) {
      panel.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [openedId])

  // Core refuses every write to an archived workspace, and one mid-import
  const writable = workspace.status === 'NEW' || workspace.status === 'ACTIVE'
  const root = rootOf(categories, kind)
  const chain = opened ? lineage(categories, opened.id) : []
  const onChain = new Set(chain.map((each) => each.id))
  const ringOf = (category: Category): Ring =>
    category.id === opened?.id ? 'full' : onChain.has(category.id) ? 'soft' : 'none'
  const upFromOpened = chain.at(-2)?.id ?? null

  // Tapping the chosen one again steps back up
  const choose = (category: Category) => {
    setSearch('')
    open(category.id === opened?.id ? upFromOpened : category.id)
  }
  const upFrom = (category: Category) => lineage(categories, category.id).at(-2)?.id ?? null
  const tile = (category: Category) => (
    <ManagedTile
      key={category.id}
      category={category}
      categories={categories}
      ring={ringOf(category)}
      editable={writable && category.systemCode === null}
      onClick={() => choose(category)}
      onArchived={() => {
        if (onChain.has(category.id)) {
          open(upFrom(category))
        }
      }}
    />
  )

  const query = search.trim()
  const found = searchCategories(categories, kind, query)
  // Others stays a leaf, so it opens no level of its own
  const levels = chain.filter(
    (each) => each.systemCode === null && (writable || childrenOf(categories, each.id).length > 0),
  )

  const topLevel = root ? childrenOf(categories, root.id) : []
  const cells = topLevel.map(tile)
  if (writable && root) {
    cells.unshift(<AddCategoryTile key="add" workspace={workspace} parent={root} />)
  }
  const openedAt = cells.findIndex((cell) => cell.key === chain[0]?.id)
  // The grid is always four across, so the panel can go straight under the tapped tile's row
  const rowEnd = openedAt < 0 ? cells.length : (Math.floor(openedAt / COLUMNS) + 1) * COLUMNS

  return (
    <section
      aria-label={t(`operations.kind.${kind}`)}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-3"
    >
      <CardHeader
        title={t(`operations.kind.${kind}`)}
        search={search}
        onSearch={setSearch}
        label={t('operations.form.searchCategories')}
      />
      <div className="grid grid-cols-4 gap-x-2 gap-y-2 empty:hidden">
        {query ? found.top.map(tile) : cells.slice(0, rowEnd)}
        {opened && !query && (levels.length > 0 || opened.systemCode !== null) && (
          <div
            ref={panel}
            className="col-span-4 flex scroll-mb-24 flex-col gap-3 rounded-xl bg-muted/50 p-2 md:scroll-mb-4"
          >
            {levels.map((parent, index) => (
              <TileGroup
                key={parent.id}
                divided={index > 0}
                caption={
                  <>
                    <span className="truncate">{parent.name}</span>
                    <ChevronRight aria-hidden className="size-3 shrink-0" />
                  </>
                }
              >
                {writable && <AddCategoryTile workspace={workspace} parent={parent} />}
                {childrenOf(categories, parent.id).map(tile)}
              </TileGroup>
            ))}
            {opened.systemCode !== null && (
              <p className="px-1 text-sm text-muted-foreground">{t('categories.fixedText')}</p>
            )}
          </div>
        )}
        {!query && cells.slice(rowEnd)}
      </div>
      {!query && writable && (
        // Faded as far as AA allows: 85% of Muted Ink is about 4.7:1 on the card
        <p className="px-1 text-center text-[11px] text-muted-foreground/85 md:hidden">
          {t('categories.holdHint')}
        </p>
      )}
      {!query && <ArchivedCategories categories={categories} kind={kind} writable={writable} />}
      {query && (
        <>
          <FoundGroups found={found} tile={tile} />
          {found.top.length === 0 && found.below.length === 0 && (
            <p className="py-2 text-center text-sm text-muted-foreground">
              {t('operations.form.noCategory')}
            </p>
          )}
        </>
      )}
    </section>
  )
}

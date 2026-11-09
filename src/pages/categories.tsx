import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { Pending } from '@/components/cards'
import {
  AddCategoryButton,
  CategoryActionDialog,
  CategoryMenu,
  type CategoryAction,
} from '@/components/category-actions'
import { EntityIcon } from '@/components/entity-icon'
import { KindToggle } from '@/components/form-header'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import type { Category, CategoryKind, Workspace } from '@/core/api'
import { childrenOf, lineage, rootOf } from '@/core/categories'
import { useCategories } from '@/hooks/use-categories'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

const BRANCHES: CategoryKind[] = ['EXPENSE', 'INCOME']

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
  // In the URL, so the phone's back gesture closes the details
  const open = (id: string | null) => setParams(id ? { category: id } : {})

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('sections.categories')}
        actions={
          <KindToggle
            value={kind}
            onChange={(next) => {
              setChosenKind(next)
              open(null)
            }}
            kinds={BRANCHES}
          />
        }
      />
      {error ? (
        <LoadError title={t('errors.loadCategories')} error={error} onRetry={() => void refetch()} />
      ) : !categories ? (
        <Pending>{t('common.loading')}</Pending>
      ) : (
        <CategoryBrowser
          workspace={workspace}
          categories={categories}
          kind={kind}
          opened={opened}
          open={open}
        />
      )}
    </div>
  )
}

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
  const { t } = useTranslation()
  // Core refuses every write to an archived workspace, and one mid-import
  const writable = workspace.status === 'NEW' || workspace.status === 'ACTIVE'
  const root = rootOf(categories, kind)
  const topLevel = root ? childrenOf(categories, root.id) : []
  // A phone starts on the list alone; a wide screen has room to show the first one's details
  const shown = opened ?? topLevel[0]
  const activeId = shown && lineage(categories, shown.id)[0]?.id

  return (
    <section
      aria-label={t(`operations.kind.${kind}`)}
      className="grid rounded-2xl border bg-card md:min-h-[32rem] md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]"
    >
      <div className={cn('flex flex-col gap-3 p-3 md:border-r md:p-4', opened && 'hidden md:flex')}>
        <ul className="flex flex-col gap-1">
          {topLevel.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                aria-current={category.id === activeId ? 'true' : undefined}
                onClick={() => open(category.id)}
                className="flex min-h-13 w-full items-center gap-3 rounded-xl px-2 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 md:aria-current:bg-(--ws)/10 md:aria-current:font-semibold"
              >
                <EntityIcon entity={category} className="size-9 rounded-[10px]" />
                <span className="min-w-0 flex-1 truncate text-[15px]">{category.name}</span>
                <ChildCount categories={categories} category={category} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground md:hidden" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        {writable && root && <AddCategoryButton workspace={workspace} root={root} />}
      </div>
      {shown && (
        <div className={cn('flex min-w-0 p-4 md:p-6', !opened && 'hidden md:flex')}>
          {/* Keyed, so an action left open on one category never carries over to the next */}
          <CategoryDetails
            key={shown.id}
            workspace={workspace}
            categories={categories}
            category={shown}
            writable={writable}
            open={open}
          />
        </div>
      )}
    </section>
  )
}

function ChildCount({ categories, category }: { categories: Category[]; category: Category }) {
  const count = childrenOf(categories, category.id).length
  return count > 0 && <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{count}</span>
}

function CategoryDetails({
  workspace,
  categories,
  category,
  writable,
  open,
}: {
  workspace: Workspace
  categories: Category[]
  category: Category
  writable: boolean
  open: (id: string | null) => void
}) {
  const [action, setAction] = useState<CategoryAction | null>(null)
  const { t } = useTranslation()
  const ancestors = lineage(categories, category.id).slice(0, -1)
  const children = childrenOf(categories, category.id)
  const fixed = category.systemCode !== null
  const editable = writable && !fixed

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <Button
        variant="ghost"
        onClick={() => open(ancestors.at(-1)?.id ?? null)}
        className="-ml-2 h-11 self-start text-muted-foreground md:hidden"
      >
        <ChevronLeft aria-hidden />
        {t('categories.back')}
      </Button>
      <header className="flex items-center gap-3">
        <EntityIcon entity={category} className="size-13 rounded-xl text-base" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
            <span>{t(`operations.kind.${category.kind}`)}</span>
            <ChevronRight className="size-3.5" aria-hidden />
            {ancestors.map((ancestor) => (
              <span key={ancestor.id} className="flex min-w-0 items-center gap-x-1">
                <button
                  type="button"
                  onClick={() => open(ancestor.id)}
                  className="min-w-0 truncate rounded outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {ancestor.name}
                </button>
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              </span>
            ))}
          </p>
          <h2 className="truncate text-xl font-bold">{category.name}</h2>
        </div>
        {editable && (
          <Button variant="outline" onClick={() => setAction('rename')} className="h-11 md:h-9">
            {t('categories.rename.action')}
          </Button>
        )}
        {fixed && <span className="shrink-0 text-xs text-muted-foreground">{t('categories.fixed')}</span>}
      </header>
      {fixed ? (
        <p className="text-sm text-muted-foreground">{t('categories.fixedText')}</p>
      ) : (
        <section className="flex flex-col gap-1">
          <div className="flex min-h-11 items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{t('categories.subcategories')}</h3>
            {editable && (
              <Button variant="secondary" onClick={() => setAction('add')} className="h-11 md:h-9">
                <Plus aria-hidden />
                {t('categories.create.action')}
              </Button>
            )}
          </div>
          {children.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">{t('categories.noSubcategories')}</p>
          ) : (
            <ul className="divide-y">
              {children.map((child) => (
                <li key={child.id} className="flex items-center gap-1 py-1">
                  <button
                    type="button"
                    onClick={() => open(child.id)}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <EntityIcon entity={child} className="size-7 rounded-lg text-[11px]" />
                    <span className="min-w-0 flex-1 truncate text-[15px]">{child.name}</span>
                    <ChildCount categories={categories} category={child} />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                  {writable && <CategoryMenu workspace={workspace} category={child} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {editable && (
        <footer className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button variant="outline" onClick={() => setAction('move')} className="h-11 md:h-9">
            {t('categories.move.action')}
          </Button>
        </footer>
      )}
      <CategoryActionDialog
        workspace={workspace}
        category={category}
        action={action}
        onClose={() => setAction(null)}
      />
    </div>
  )
}

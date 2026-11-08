import { ChevronRight } from 'lucide-react'
import { Fragment, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon } from '@/components/entity-icon'
import { PickerList, PickerPopup, PickerTrigger, RecentChips } from '@/components/entity-picker'
import { CommandItem } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import type { Category, CategoryKind } from '@/core/api'
import { categoryOptions, categoryPath } from '@/core/categories'
import { recentCategoryIds } from '@/core/recent'
import { useWorkspaceFeed } from '@/hooks/use-feed'
import { cn } from '@/lib/utils'

const RECENT = 6

// The field showing the category with its path, the recent ones as chips, and the whole branch to search
export function CategoryPicker({
  workspaceId,
  categories,
  kind,
  value,
  onChange,
  error,
}: {
  workspaceId: string
  categories: Category[]
  kind: CategoryKind
  value: string
  onChange: (categoryId: string) => void
  error: string | undefined
}) {
  const { t } = useTranslation()
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const feed = useWorkspaceFeed(workspaceId)

  const options = categoryOptions(categories, kind)
  const offered = new Map(options.map(({ category }) => [category.id, category]))
  const selected = offered.get(value)
  const recent = recentCategoryIds(feed.data?.pages.flatMap((page) => page.items) ?? [], kind, RECENT)
    .map((id) => offered.get(id))
    .filter((category) => category !== undefined)

  // Every opening starts from the whole tree
  const openList = (next: boolean) => {
    setOpen(next)
    setSearch('')
  }
  const choose = (categoryId: string) => {
    onChange(categoryId)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* The icon and the path say what the field is; the label stays for screen readers */}
      <Label htmlFor={fieldId} className="sr-only">
        {t('operations.form.category')}
      </Label>
      <PickerPopup
        title={t('operations.form.category')}
        open={open}
        onOpenChange={openList}
        trigger={
          <PickerTrigger id={fieldId} aria-invalid={!!error}>
            {selected && <EntityIcon entity={selected} className="size-8 rounded-lg text-xs" />}
            <span className="min-w-0 flex-1 truncate">
              {selected && <Path names={categoryPath(categories, selected.id)} />}
            </span>
          </PickerTrigger>
        }
      >
        <PickerList
          value={value}
          search={search}
          onSearch={setSearch}
          placeholder={t('operations.form.searchCategories')}
          empty={t('operations.form.noCategory')}
        >
          {options.map(({ category, depth }) => {
            const path = categoryPath(categories, category.id)
            return (
              <CommandItem
                key={category.id}
                value={category.id}
                keywords={path}
                data-checked={category.id === value}
                onSelect={() => choose(category.id)}
                // Searching flattens the tree, and each result shows where it sits instead
                style={search ? undefined : { paddingLeft: `${0.5 + depth * 1.5}rem` }}
                className="min-h-11 gap-3"
              >
                <EntityIcon entity={category} className="size-8 rounded-lg text-xs" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{category.name}</span>
                  {search && path.length > 1 && (
                    <span className="truncate text-xs text-muted-foreground">
                      <Path names={path.slice(0, -1)} />
                    </span>
                  )}
                </span>
              </CommandItem>
            )
          })}
        </PickerList>
      </PickerPopup>
      <RecentChips
        items={recent}
        value={value}
        onChange={onChange}
        icon={(category) => <EntityIcon entity={category} className="size-6 rounded-md text-[10px]" />}
        allLabel={t('operations.form.all')}
        onAll={() => openList(true)}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

// Names joined by chevrons; the ones above the category itself muted
function Path({ names }: { names: string[] }) {
  return names.map((name, index) => (
    <Fragment key={index}>
      {index > 0 && <ChevronRight aria-hidden className="mx-0.5 inline size-3 text-muted-foreground" />}
      <span className={cn(names.length > 1 && index < names.length - 1 && 'text-muted-foreground')}>
        {name}
      </span>
    </Fragment>
  ))
}

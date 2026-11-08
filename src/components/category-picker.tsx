import { ChevronRight } from 'lucide-react'
import { Fragment, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon } from '@/components/entity-icon'
import { PickerList, PickerPopup, pickerRow } from '@/components/entity-picker'
import { CommandItem } from '@/components/ui/command'
import type { Category, CategoryKind } from '@/core/api'
import { categoryOptions, categoryPath } from '@/core/categories'
import { cn } from '@/lib/utils'

// The whole branch to search, opened from `trigger`: the tree, flattened into paths while searching
export function CategorySearch({
  workspaceId,
  categories,
  kind,
  value,
  onChoose,
  trigger,
}: {
  workspaceId: string
  categories: Category[]
  kind: CategoryKind
  value: string
  onChoose: (categoryId: string) => void
  trigger: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Every opening starts from the whole tree
  const openList = (next: boolean) => {
    setOpen(next)
    setSearch('')
  }
  const choose = (categoryId: string) => {
    onChoose(categoryId)
    setOpen(false)
  }

  return (
    <PickerPopup
      workspaceId={workspaceId}
      title={t('operations.form.category')}
      open={open}
      onOpenChange={openList}
      trigger={trigger}
    >
      <PickerList
        value={value}
        search={search}
        onSearch={setSearch}
        placeholder={t('operations.form.searchCategories')}
        empty={t('operations.form.noCategory')}
      >
        {categoryOptions(categories, kind).map(({ category, depth }) => {
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
              className={pickerRow}
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
  )
}

// Names joined by chevrons; the ones above the last muted
export function Path({ names }: { names: string[] }) {
  return names.map((name, index) => (
    <Fragment key={index}>
      {index > 0 && <ChevronRight aria-hidden className="mx-0.5 inline size-3 text-muted-foreground" />}
      <span className={cn(names.length > 1 && index < names.length - 1 && 'text-muted-foreground')}>
        {name}
      </span>
    </Fragment>
  ))
}

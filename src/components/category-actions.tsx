import { Check, EllipsisVertical, FolderInput, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon } from '@/components/entity-icon'
import { Field } from '@/components/field'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { fieldError, hasFieldErrors, type Category, type Workspace } from '@/core/api'
import { moveTargets } from '@/core/categories'
import { useCategories } from '@/hooks/use-categories'
import { useCreateCategory, useReviseCategory } from '@/hooks/use-category-mutations'

// The dashed control closing the branch's card, adding to its top level
export function AddCategoryButton({ workspace, root }: { workspace: Workspace; root: Category }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-muted-foreground/30 text-sm font-semibold text-muted-foreground outline-none hover:border-(--ws)/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus className="size-4" aria-hidden />
        {t('categories.add')}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <CreateForm workspace={workspace} parent={root} onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export type CategoryAction = 'add' | 'rename' | 'move'

export function CategoryActionDialog({
  workspace,
  category,
  action,
  onClose,
}: {
  workspace: Workspace
  category: Category
  action: CategoryAction | null
  onClose: () => void
}) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {action === 'add' && <CreateForm workspace={workspace} parent={category} onCreated={onClose} />}
        {action === 'rename' && <RenameForm category={category} onRenamed={onClose} />}
        {action === 'move' && <MoveForm category={category} onMoved={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

export function CategoryMenu({ workspace, category }: { workspace: Workspace; category: Category }) {
  const [dialog, setDialog] = useState<CategoryAction | null>(null)
  const { t } = useTranslation()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('categories.actions', { name: category.name })}
            className="size-11 shrink-0 rounded-[10px] text-muted-foreground md:size-9"
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
          <DropdownMenuItem onSelect={() => setDialog('add')} className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <Plus aria-hidden />
            {t('categories.addSubcategory')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog('rename')} className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <Pencil aria-hidden />
            {t('categories.rename.action')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog('move')} className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <FolderInput aria-hidden />
            {t('categories.move.action')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Beside the menu, not inside it: the menu's content unmounts as soon as an item is chosen */}
      <CategoryActionDialog
        workspace={workspace}
        category={category}
        action={dialog}
        onClose={() => setDialog(null)}
      />
    </>
  )
}

function CreateForm({
  workspace,
  parent,
  onCreated,
}: {
  workspace: Workspace
  parent: Category
  onCreated: () => void
}) {
  const create = useCreateCategory(workspace.id)
  const { t } = useTranslation()

  return (
    <NameForm
      title={
        parent.parentId
          ? t('categories.create.subcategoryTitle', { name: parent.name })
          : t('categories.create.title')
      }
      description={workspace.status === 'NEW' ? t('categories.create.closesImport') : undefined}
      initial=""
      error={create.error}
      pending={create.isPending}
      submitLabel={t(create.isPending ? 'categories.create.creating' : 'categories.create.action')}
      onSubmit={(name) => create.mutate({ name, parentId: parent.id }, { onSuccess: onCreated })}
    />
  )
}

function RenameForm({ category, onRenamed }: { category: Category; onRenamed: () => void }) {
  const rename = useReviseCategory(category)
  const { t } = useTranslation()

  return (
    <NameForm
      title={t('categories.rename.title', { name: category.name })}
      initial={category.name}
      error={rename.error}
      pending={rename.isPending}
      submitLabel={t(rename.isPending ? 'common.saving' : 'common.save')}
      onSubmit={(name) => rename.mutate({ name }, { onSuccess: onRenamed })}
    />
  )
}

// Mounted only while its dialog is open, so every opening starts from where the category is now
function MoveForm({ category, onMoved }: { category: Category; onMoved: () => void }) {
  const move = useReviseCategory(category)
  const { data: categories = [] } = useCategories(category.workspaceId)
  const [parentId, setParentId] = useState(category.parentId!)
  const { t } = useTranslation()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    move.mutate({ parentId }, { onSuccess: onMoved })
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('categories.move.title', { name: category.name })}</DialogTitle>
        <DialogDescription>{t('categories.move.text')}</DialogDescription>
      </DialogHeader>
      <fieldset className="flex max-h-[50dvh] flex-col overflow-y-auto">
        <legend className="sr-only">{t('categories.move.target')}</legend>
        {moveTargets(categories, category).map(({ category: target, depth }) => (
          <label
            key={target.id}
            style={{ paddingLeft: `${8 + depth * 20}px` }}
            className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-lg pr-2 has-checked:bg-muted has-checked:font-semibold has-focus-visible:ring-3 has-focus-visible:ring-ring/50 md:min-h-9"
          >
            <input
              type="radio"
              name="category-parent"
              value={target.id}
              checked={parentId === target.id}
              onChange={() => setParentId(target.id)}
              className="sr-only"
            />
            {target.parentId && <EntityIcon entity={target} className="size-6 rounded-md text-[10px]" />}
            <span className="min-w-0 flex-1 truncate">
              {target.parentId ? target.name : t('categories.move.topLevel')}
            </span>
            <Check className="hidden size-4 shrink-0 group-has-checked:block" aria-hidden />
          </label>
        ))}
      </fieldset>
      {move.error && <Problem error={move.error} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={parentId === category.parentId || move.isPending}
          className="h-11 font-bold md:h-9"
        >
          {t(move.isPending ? 'common.saving' : 'categories.move.action')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Mounted only while its dialog is open, so every opening starts from `initial`
function NameForm({
  title,
  description,
  initial,
  error,
  pending,
  submitLabel,
  onSubmit,
}: {
  title: string
  description?: string
  initial: string
  error: Error | null
  pending: boolean
  submitLabel: string
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  const { t } = useTranslation()
  const trimmed = name.trim()
  const nameError = fieldError(error, 'name')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <Field id="category-name" label={t('common.name')} error={nameError}>
        <Input
          id="category-name"
          aria-invalid={!!nameError}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={30}
          className="h-11"
        />
      </Field>
      {error && !hasFieldErrors(error) && <Problem error={error} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={!trimmed || trimmed === initial || pending}
          className="h-11 font-bold md:h-9"
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

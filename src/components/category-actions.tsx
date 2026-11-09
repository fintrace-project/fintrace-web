import { Archive, Check, EllipsisVertical, FolderInput, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon } from '@/components/entity-icon'
import { TileName, tileClass } from '@/components/entity-tile'
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
import { useArchiveCategory, useCreateCategory, useReviseCategory } from '@/hooks/use-category-mutations'

// The dashed tile opening a group, so a long list needs no scrolling to add to it
export function AddCategoryTile({ workspace, parent }: { workspace: Workspace; parent: Category }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={tileClass}>
        <span className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-dashed border-muted-foreground/30 text-muted-foreground">
          <Plus className="size-5" aria-hidden />
        </span>
        <TileName large>{t(parent.parentId ? 'categories.addSubcategory' : 'categories.add')}</TileName>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <CreateForm workspace={workspace} parent={parent} onCreated={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

type CategoryAction = 'rename' | 'move' | 'archive'

// The dialog is beside the menu, as the menu's content unmounts once an item is chosen
export function CategoryMenu({
  category,
  open,
  onOpenChange,
  onArchived,
}: {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchived: () => void
}) {
  const [dialog, setDialog] = useState<CategoryAction | null>(null)
  const { t } = useTranslation()

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          {/* On a phone the long press opens it: unseen, still there for a screen reader, and as big as the tile
              so that the menu opens clear of the finger, which would choose an item on lifting */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('categories.actions', { name: category.name })}
            className="absolute top-0 right-0 size-7 rounded-full text-muted-foreground max-md:pointer-events-none max-md:size-full max-md:opacity-0"
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
          <DropdownMenuItem onSelect={() => setDialog('rename')} className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <Pencil aria-hidden />
            {t('categories.rename.action')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog('move')} className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <FolderInput aria-hidden />
            {t('categories.move.action')}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog('archive')}
            className="min-h-11 gap-2.5 px-2 md:min-h-9"
          >
            <Archive aria-hidden />
            {t('categories.archive.action')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CategoryActionDialog
        category={category}
        action={dialog}
        onClose={() => setDialog(null)}
        onArchived={onArchived}
      />
    </>
  )
}

function CategoryActionDialog({
  category,
  action,
  onClose,
  onArchived,
}: {
  category: Category
  action: CategoryAction | null
  onClose: () => void
  onArchived?: () => void
}) {
  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Never scrolls itself: the move's list takes what height is left and scrolls alone, or a short screen
          gets two scrollbars, one eating into the footer */}
      <DialogContent className="flex flex-col overflow-hidden">
        {action === 'rename' && <RenameForm category={category} onRenamed={onClose} />}
        {action === 'move' && <MoveForm category={category} onMoved={onClose} />}
        {action === 'archive' && (
          <ArchiveConfirmation
            category={category}
            onArchived={() => {
              onClose()
              onArchived?.()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
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
    <form onSubmit={submit} className="flex min-h-0 min-w-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('categories.move.title', { name: category.name })}</DialogTitle>
        <DialogDescription>{t('categories.move.text')}</DialogDescription>
      </DialogHeader>
      <fieldset className="flex max-h-[50dvh] min-h-0 flex-col overflow-y-auto">
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

function ArchiveConfirmation({ category, onArchived }: { category: Category; onArchived: () => void }) {
  const archive = useArchiveCategory(category)
  const { t } = useTranslation()

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('categories.archive.title', { name: category.name })}</DialogTitle>
        <DialogDescription>{t('categories.archive.text')}</DialogDescription>
      </DialogHeader>
      {archive.error && <Problem error={archive.error} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={archive.isPending}
          onClick={() => archive.mutate(undefined, { onSuccess: onArchived })}
          className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9"
        >
          {t(archive.isPending ? 'categories.archive.archiving' : 'categories.archive.action')}
        </Button>
      </DialogFooter>
    </div>
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

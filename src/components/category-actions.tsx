import { Archive, ChevronRight, EllipsisVertical, FolderInput, ListTree, Pencil, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChildBadge, FoundGroups } from '@/components/category-grid'
import { CardHeader, EntityTile, TileGroup, TileName, tileClass, type Ring } from '@/components/entity-tile'
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
import { childrenOf, lineage, moveTargets, searchCategories } from '@/core/categories'
import { useCategories } from '@/hooks/use-categories'
import { useArchiveCategory, useCreateCategory, useReviseCategory } from '@/hooks/use-category-mutations'
import { cn } from '@/lib/utils'

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
        <DropdownMenuContent align="end" className="w-48">
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
  const [search, setSearch] = useState('')
  const { t } = useTranslation()

  // The branch's root first, then everything but the category's own subtree and Others
  const [root, ...below] = moveTargets(categories, category).map((option) => option.category)
  const allowed = new Set(below.map((each) => each.id))
  const allowedChildren = (id: string) => childrenOf(categories, id).filter((each) => allowed.has(each.id))
  const chain = lineage(categories, parentId)
  const onChain = new Set(chain.map((each) => each.id))
  const ringOf = (target: Category): Ring =>
    target.id === parentId ? 'full' : onChain.has(target.id) ? 'soft' : 'none'
  const choose = (target: Category) => {
    setParentId(target.id)
    setSearch('')
  }
  const tile = (target: Category) => (
    <EntityTile
      key={target.id}
      entity={target}
      ring={ringOf(target)}
      badge={<ChildBadge count={allowedChildren(target.id).length} />}
      onClick={() => choose(target)}
    />
  )

  const query = search.trim()
  const everyMatch = searchCategories(categories, category.kind, query)
  const found = {
    top: everyMatch.top.filter((each) => allowed.has(each.id)),
    below: everyMatch.below
      .map((group) => ({ ...group, matches: group.matches.filter((each) => allowed.has(each.id)) }))
      .filter((group) => group.matches.length > 0),
  }
  const levels = chain.filter((each) => allowedChildren(each.id).length > 0)

  // As on the categories page: the chosen tile's levels open straight under its row
  const cells = root
    ? [
        <TopLevelTile key="top" chosen={parentId === root.id} onClick={() => choose(root)} />,
        ...allowedChildren(root.id).map(tile),
      ]
    : []
  const openedAt = cells.findIndex((cell) => cell.key === chain[0]?.id)
  const rowEnd = openedAt < 0 ? cells.length : (Math.floor(openedAt / 4) + 1) * 4

  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panel.current?.scrollIntoView({ block: 'nearest' })
  }, [parentId])

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
      {/* The operation form's picker, less the ranking by use: the category's own subtree and Others are no
          place to move it to, and the branch's root is offered as the top level */}
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
        <CardHeader
          title={t(`operations.kind.${category.kind}`)}
          search={search}
          onSearch={setSearch}
          label={t('operations.form.searchCategories')}
        />
        <div className="grid grid-cols-4 gap-2 empty:hidden">
          {query ? found.top.map(tile) : cells.slice(0, rowEnd)}
          {!query && levels.length > 0 && (
            <div ref={panel} className="col-span-4 flex flex-col gap-3 rounded-xl bg-muted/50 p-2">
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
                  {allowedChildren(parent.id).map(tile)}
                </TileGroup>
              ))}
            </div>
          )}
          {!query && cells.slice(rowEnd)}
        </div>
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
      </div>
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

// The branch's root as a choice: no entity of its own to draw, so a tree in a plain circle
function TopLevelTile({ chosen, onClick }: { chosen: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button type="button" aria-pressed={chosen} onClick={onClick} className={tileClass}>
      <span
        className={cn(
          'rounded-full p-0.5 ring-2 ring-transparent transition-shadow',
          chosen && 'ring-(--ws)',
        )}
      >
        <span className="flex size-13 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ListTree aria-hidden className="size-5" />
        </span>
      </span>
      <TileName selected={chosen}>{t('categories.move.topLevel')}</TileName>
    </button>
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

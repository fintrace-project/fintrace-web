import { Archive, ArchiveRestore, EllipsisVertical, Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Field } from '@/components/field'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { fieldError, hasFieldErrors, type Account } from '@/core/api'
import { useRenameAccount, useSetAccountArchived } from '@/hooks/use-account-mutations'

// An active account's menu. Archiving is reversible, so it takes one click and no confirmation; the
// archived list below is its undo
export function AccountMenu({ account }: { account: Account }) {
  const [renaming, setRenaming] = useState(false)
  const setArchived = useSetAccountArchived(account)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={setArchived.isPending}
            aria-label={t('accounts.actions', { name: account.name })}
            className="size-11 rounded-control md:size-9"
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setRenaming(true)} className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <Pencil aria-hidden />
            {t('accounts.rename.action')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setArchived.mutate(true)}
            className="min-h-11 gap-2.5 px-2 md:min-h-9"
          >
            <Archive aria-hidden />
            {t('accounts.archive')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Beside the menu, not inside it: the menu's content unmounts as soon as an item is chosen */}
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <RenameForm account={account} onRenamed={() => setRenaming(false)} />
        </DialogContent>
      </Dialog>
      {setArchived.error && <Problem error={setArchived.error} />}
    </div>
  )
}

// Mounted only while the dialog is open, so every opening starts from the current name
function RenameForm({ account, onRenamed }: { account: Account; onRenamed: () => void }) {
  const rename = useRenameAccount(account)
  const [name, setName] = useState(account.name)
  const { t } = useTranslation()
  const changed = name.trim() !== account.name

  const submit = (event: FormEvent) => {
    event.preventDefault()
    rename.mutate(name.trim(), { onSuccess: onRenamed })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('accounts.rename.title', { name: account.name })}</DialogTitle>
      </DialogHeader>
      <Field id="rename-account" label={t('common.name')} error={fieldError(rename.error, 'name')}>
        <Input
          id="rename-account"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={30}
          className="h-11"
        />
      </Field>
      {rename.error && !hasFieldErrors(rename.error) && <Problem error={rename.error} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!changed || rename.isPending} className="h-11 font-bold md:h-9">
          {t(rename.isPending ? 'common.saving' : 'common.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RestoreButton({ account }: { account: Account }) {
  const setArchived = useSetAccountArchived(account)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        disabled={setArchived.isPending}
        onClick={() => setArchived.mutate(false)}
        className="h-11 w-fit rounded-control px-4 font-semibold md:h-9"
      >
        <ArchiveRestore aria-hidden />
        {t(setArchived.isPending ? 'accounts.restoring' : 'accounts.restore')}
      </Button>
      {setArchived.error && <Problem error={setArchived.error} />}
    </div>
  )
}

import { Scale } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fieldError, hasFieldErrors, type Account, type AccountBalance, type Workspace } from '@/core/api'
import { toDecimal } from '@/core/decimal'
import { isWritable } from '@/core/workspaces'
import { useCreateAnchor } from '@/hooks/use-anchors'

// Records the balance counted as an anchor dated now (§4.6); never offered on an archived account
export function RecordBalanceButton({
  workspace,
  account,
  balance,
}: {
  workspace: Workspace
  account: Account
  balance: AccountBalance | undefined
}) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  if (account.archived || !isWritable(workspace)) {
    return null
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11 rounded-[10px] px-4 font-semibold">
          <Scale aria-hidden />
          {t('anchors.record.action')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <RecordBalanceForm
          workspace={workspace}
          account={account}
          balance={balance}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// Mounted only while the dialog is open, so every opening starts from Core's current figure, selected so typing
// the counted one replaces it
function RecordBalanceForm({
  workspace,
  account,
  balance,
  onSaved,
}: {
  workspace: Workspace
  account: Account
  balance: AccountBalance | undefined
  onSaved: () => void
}) {
  const create = useCreateAnchor(workspace.id, account.id)
  const [value, setValue] = useState(balance ? String(balance.balance) : '')
  const { t } = useTranslation()
  const error = fieldError(create.error, 'value')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const counted = toDecimal(value)
    if (counted !== null) {
      create.mutate(counted, { onSuccess: onSaved })
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('anchors.record.title', { name: account.name })}</DialogTitle>
        <DialogDescription>
          {t(workspace.status === 'NEW' ? 'anchors.record.closesImport' : 'anchors.record.text')}
        </DialogDescription>
      </DialogHeader>
      <Field
        id="anchor-value"
        label={t('anchors.record.value', { currency: account.currency })}
        error={error}
      >
        {/* No decimal inputMode: a phone's decimal pad has no minus, and a balance can be negative */}
        <Input
          id="anchor-value"
          aria-invalid={!!error}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={(event) => event.target.select()}
          pattern="-?\d+([.,]\d+)?"
          required
          autoFocus
          autoComplete="off"
          placeholder="0.00"
          aria-describedby="anchor-value-hint"
          className="h-11 tabular-nums sm:max-w-48"
        />
        <span id="anchor-value-hint" className="text-xs text-muted-foreground">
          {t('anchors.record.hint')}
        </span>
      </Field>
      {create.error && !hasFieldErrors(create.error) && <Problem error={create.error} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={create.isPending} className="h-11 font-bold md:h-9">
          {t(create.isPending ? 'common.saving' : 'common.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}

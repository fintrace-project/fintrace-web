import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencySelect } from '@/components/currency-select'
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
import { fieldError, hasFieldErrors, type Workspace } from '@/core/api'
import { useCreateAccount } from '@/hooks/use-account-mutations'

// The dashed tile closing the accounts grid, opening the form
export function CreateAccountDialog({ workspace }: { workspace: Workspace }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-input text-muted-foreground outline-none hover:border-(--ws)/50 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        <Plus className="size-6" aria-hidden />
        <span className="text-[15px] font-semibold">{t('accounts.add')}</span>
      </DialogTrigger>
      <DialogContent>
        <CreateAccountForm workspace={workspace} onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// A decimal as typed, a comma accepted for the point; anything else is left to the pattern to refuse
const toDecimal = (typed: string) => (typed.trim() === '' ? null : Number(typed.trim().replace(',', '.')))

// Mounted only while the dialog is open, so every opening starts from an empty form
function CreateAccountForm({ workspace, onCreated }: { workspace: Workspace; onCreated: () => void }) {
  const create = useCreateAccount(workspace.id)
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState(workspace.defaultCurrency)
  const [initialBalance, setInitialBalance] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      { name: name.trim(), currency, initialBalance: toDecimal(initialBalance) },
      { onSuccess: onCreated },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('accounts.create.title')}</DialogTitle>
        <DialogDescription>
          {t(workspace.status === 'NEW' ? 'accounts.create.closesImport' : 'accounts.create.text')}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Field id="account-name" label={t('common.name')} error={fieldError(create.error, 'name')}>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('accounts.create.namePlaceholder')}
            required
            maxLength={30}
            className="h-11"
          />
        </Field>
        <Field
          id="account-currency"
          label={t('accounts.create.currency')}
          error={fieldError(create.error, 'currency')}
        >
          <CurrencySelect id="account-currency" value={currency} onChange={setCurrency} />
        </Field>
      </div>
      <Field
        id="account-initial-balance"
        label={t('accounts.create.initialBalance')}
        error={fieldError(create.error, 'initialBalance')}
      >
        {/* No decimal inputMode: a phone's decimal pad has no minus, and a card's balance can be negative */}
        <Input
          id="account-initial-balance"
          value={initialBalance}
          onChange={(event) => setInitialBalance(event.target.value)}
          pattern="-?\d+([.,]\d+)?"
          autoComplete="off"
          placeholder="0.00"
          aria-describedby="account-initial-balance-hint"
          className="h-11 tabular-nums sm:max-w-48"
        />
        <span id="account-initial-balance-hint" className="text-xs text-muted-foreground">
          {t('accounts.create.initialBalanceHint')}
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
          {t(create.isPending ? 'accounts.create.creating' : 'accounts.create.action')}
        </Button>
      </DialogFooter>
    </form>
  )
}

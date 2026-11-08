import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AccountPicker } from '@/components/account-picker'
import { Pending } from '@/components/cards'
import { CategoryPicker } from '@/components/category-picker'
import { DateTimePicker } from '@/components/date-time-picker'
import { Field } from '@/components/field'
import { LoadError } from '@/components/load-error'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  fieldError,
  hasFieldErrors,
  type Account,
  type Category,
  type CategoryKind,
  type Workspace,
} from '@/core/api'
import { othersOf } from '@/core/categories'
import { nowLocal } from '@/core/dates'
import { amountPattern, isTypingAmount, toDecimal, withLeadingZero } from '@/core/decimal'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useCreateOperation } from '@/hooks/use-operation-mutations'
import { cn } from '@/lib/utils'

const AMOUNT_ID = 'operation-amount'

export interface FormProps {
  workspace: Workspace
  accountId: string | undefined
  onDone: () => void
}

// The form needs both lists to offer its choices; both are usually cached by the feed already
export function OperationLoader(props: FormProps) {
  const accounts = useAccounts(props.workspace.id)
  const categories = useCategories(props.workspace.id)
  const { t } = useTranslation()

  if (accounts.error && !accounts.data) {
    return (
      <LoadError title={t('errors.loadAccounts')} error={accounts.error} onRetry={() => accounts.refetch()} />
    )
  }
  if (categories.error && !categories.data) {
    return (
      <LoadError
        title={t('errors.loadCategories')}
        error={categories.error}
        onRetry={() => categories.refetch()}
      />
    )
  }
  if (!accounts.data || !categories.data) {
    return <Pending>{t('common.loading')}</Pending>
  }
  const open = accounts.data.filter((account) => !account.archived)
  if (open.length === 0) {
    return <NoAccounts workspaceId={props.workspace.id} />
  }
  return <OperationForm {...props} accounts={open} categories={categories.data} />
}

function NoAccounts({ workspaceId }: { workspaceId: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('operations.form.title')}</DialogTitle>
        <DialogDescription>{t('operations.form.noAccounts')}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button asChild className="h-11 font-bold md:h-9">
          <Link to={`/w/${workspaceId}/accounts`}>{t('operations.form.toAccounts')}</Link>
        </Button>
      </DialogFooter>
    </div>
  )
}

// Mounted only while the dialog is open, so every opening starts from a fresh form dated now
function OperationForm({
  workspace,
  accountId,
  onDone,
  accounts,
  categories,
}: FormProps & { accounts: Account[]; categories: Category[] }) {
  const create = useCreateOperation(workspace.id)
  const { t } = useTranslation()
  const [kind, setKind] = useState<CategoryKind>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [account, setAccount] = useState(accounts.find((each) => each.id === accountId) ?? accounts[0]!)
  const [categoryId, setCategoryId] = useState(othersOf(categories, 'EXPENSE')?.id ?? '')
  const [occurredAt, setOccurredAt] = useState(nowLocal)
  const [comment, setComment] = useState('')

  const errorOf = (field: string) => fieldError(create.error, field)
  const fixedAccount = account.id === accountId

  const changeKind = (next: CategoryKind) => {
    setKind(next)
    setCategoryId(othersOf(categories, next)?.id ?? '')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        amount: toDecimal(amount) ?? 0,
        kind,
        accountId: account.id,
        categoryId: categoryId || null,
        occurredAt,
        comment: comment.trim() || null,
      },
      { onSuccess: onDone },
    )
  }

  return (
    // min-w-0: a grid item is otherwise as wide as its widest content, and the chips' row would widen the dialog
    // Compact enough for one phone screen: the switch takes the title's row, and every field shows what it
    // is by its icon or placeholder, its label kept for screen readers only
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-3">
      <DialogTitle className="sr-only">{t('operations.form.title')}</DialogTitle>

      <KindToggle value={kind} onChange={changeKind} />

      {/* The form's main figure gets a little more room than the rows around it */}
      <div className="py-1.5">
        <Field id={AMOUNT_ID} label={t('operations.form.amount')} error={errorOf('amount')} hideLabel>
          <AmountInput
            value={amount}
            onChange={setAmount}
            income={kind === 'INCOME'}
            currency={account.currency}
            invalid={!!errorOf('amount')}
          />
        </Field>
      </div>

      {/* Opened from an account's page, the operation is that account's, so there is nothing to choose */}
      {!fixedAccount && (
        <AccountPicker
          workspaceId={workspace.id}
          accounts={accounts}
          value={account.id}
          onChange={(id) => setAccount(accounts.find((each) => each.id === id)!)}
          error={errorOf('accountId')}
        />
      )}

      <CategoryPicker
        workspaceId={workspace.id}
        categories={categories}
        kind={kind}
        value={categoryId}
        onChange={setCategoryId}
        error={errorOf('categoryId')}
      />

      <DateTimePicker value={occurredAt} onChange={setOccurredAt} error={errorOf('occurredAt')} />

      <Field id="operation-comment" label={t('operations.form.comment')} error={errorOf('comment')} hideLabel>
        <Input
          id="operation-comment"
          aria-invalid={!!errorOf('comment')}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t('operations.form.commentPlaceholder')}
          maxLength={255}
          autoComplete="off"
          className="h-11"
        />
      </Field>

      {create.error && !hasFieldErrors(create.error) && <Problem error={create.error} />}
      {/* No Cancel: the close button, a tap outside and the back gesture all close the dialog */}
      <Button
        type="submit"
        disabled={create.isPending}
        className="h-12 w-full bg-(--ws) font-bold text-white hover:bg-(--ws)/85"
      >
        {t(create.isPending ? 'operations.form.adding' : 'operations.form.action')}
      </Button>
    </form>
  )
}

// Two radios drawn as one switch: the keyboard's arrows move between them, as with any radio group
function KindToggle({ value, onChange }: { value: CategoryKind; onChange: (kind: CategoryKind) => void }) {
  const { t } = useTranslation()
  return (
    <fieldset className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      <legend className="sr-only">{t('operations.form.kind')}</legend>
      {(['EXPENSE', 'INCOME'] as const).map((kind) => (
        <label
          key={kind}
          className="flex h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold text-muted-foreground has-checked:bg-card has-checked:text-foreground has-checked:shadow-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
        >
          <input
            type="radio"
            name="operation-kind"
            value={kind}
            checked={value === kind}
            onChange={() => onChange(kind)}
            className="sr-only"
          />
          {t(`operations.kind.${kind}`)}
        </label>
      ))}
    </fieldset>
  )
}

// The form's one large figure. The sign is drawn from the kind, never typed: the wire carries a magnitude.
function AmountInput({
  value,
  onChange,
  income,
  currency,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  income: boolean
  currency: string
  invalid: boolean
}) {
  return (
    // The frame is the wrapper's, so it turns red by what the input inside reports
    <span
      className={cn(
        'flex items-center gap-1 rounded-xl border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        'has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20',
        'has-user-invalid:border-destructive has-user-invalid:ring-3 has-user-invalid:ring-destructive/20',
      )}
    >
      <span
        aria-hidden
        className={cn('text-2xl font-extrabold', income ? 'text-positive' : 'text-muted-foreground')}
      >
        {income ? '+' : '−'}
      </span>
      <input
        id={AMOUNT_ID}
        // Straight to the amount: on a phone its keyboard opens with the form
        autoFocus
        aria-invalid={invalid}
        value={value}
        // A keystroke that would make it anything but a decimal is dropped, so the field never holds one
        onChange={(event) => isTypingAmount(event.target.value) && onChange(event.target.value)}
        onBlur={() => onChange(withLeadingZero(value))}
        inputMode="decimal"
        pattern={amountPattern}
        required
        autoComplete="off"
        placeholder="0.00"
        className={cn(
          'h-14 w-full min-w-0 bg-transparent text-2xl font-extrabold tabular-nums outline-none placeholder:text-muted-foreground/50',
          income && 'text-positive',
        )}
      />
      <span className="text-base font-semibold text-muted-foreground">{currency}</span>
    </span>
  )
}

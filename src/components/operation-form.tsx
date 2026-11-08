import { Pencil, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AccountGrid, AccountPill } from '@/components/account-grid'
import { Pending } from '@/components/cards'
import { CategoryGrid } from '@/components/category-grid'
import { DateTimePicker } from '@/components/date-time-picker'
import { LoadError } from '@/components/load-error'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  fieldError,
  hasFieldErrors,
  type Account,
  type Category,
  type CategoryKind,
  type OperationFeedItem,
  type Workspace,
} from '@/core/api'
import { othersOf } from '@/core/categories'
import { nowLocal } from '@/core/dates'
import { amountPattern, isTypingAmount, toDecimal, withLeadingZero } from '@/core/decimal'
import { currencySymbol } from '@/core/format'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useCancelOperation, useCreateOperation, useReviseOperation } from '@/hooks/use-operation-mutations'
import { cn } from '@/lib/utils'

export interface FormProps {
  workspace: Workspace
  accountId: string | undefined
  // The one to edit, as the feed has it; adding when absent
  operation: OperationFeedItem | undefined
  // Adding, filled from this one but dated now: a repeat of it
  template: OperationFeedItem | undefined
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
    // Its own bottom padding: the dialog leaves that to the form's pinned button strip
    <div className="flex flex-col gap-4 pb-4">
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
  operation,
  template,
  onDone,
  accounts,
  categories,
}: FormProps & { accounts: Account[]; categories: Category[] }) {
  const create = useCreateOperation(workspace.id)
  const revise = useReviseOperation(workspace.id)
  const cancel = useCancelOperation(workspace.id)
  const save = operation ? revise : create
  const { t } = useTranslation()
  // Editing starts from the operation as the feed shows it, a repeat from its template but dated now; the feed
  // never offers a transfer leg here
  const source = operation ?? template
  const [kind, setKind] = useState<CategoryKind>(source?.kind === 'INCOME' ? 'INCOME' : 'EXPENSE')
  const [amount, setAmount] = useState(source ? String(source.amount) : '')
  const [account, setAccount] = useState(
    accounts.find((each) => each.id === (source?.accountId ?? accountId)) ?? accounts[0]!,
  )
  const [categoryId, setCategoryId] = useState(
    source?.categoryId ?? othersOf(categories, 'EXPENSE')?.id ?? '',
  )
  const [occurredAt, setOccurredAt] = useState(() => operation?.occurredAt.slice(0, 16) ?? nowLocal())
  const [comment, setComment] = useState(source?.comment ?? '')
  const [accountsOpen, setAccountsOpen] = useState(false)
  // Delete asks once more in the button row itself, rather than in a second dialog over this one
  const [confirming, setConfirming] = useState(false)

  const errorOf = (field: string) => fieldError(save.error, field)
  const fixedAccount = account.id === accountId
  // The amount and the pills carry no message of their own; Core's for them is listed under the pills
  const rowErrors = ['amount', 'accountId', 'occurredAt'].flatMap((field) => errorOf(field) ?? [])

  const changeKind = (next: CategoryKind) => {
    setKind(next)
    setCategoryId(othersOf(categories, next)?.id ?? '')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const body = {
      amount: toDecimal(amount) ?? 0,
      kind,
      accountId: account.id,
      occurredAt,
      comment: comment.trim() || null,
    }
    if (operation) {
      revise.mutate({ operationId: operation.id, body: { ...body, categoryId } }, { onSuccess: onDone })
    } else {
      create.mutate({ ...body, categoryId: categoryId || null }, { onSuccess: onDone })
    }
  }

  const failure = save.error ?? cancel.error

  return (
    // min-w-0: a grid or flex item is otherwise as wide as its widest content. flex-1 with the button's mt-auto
    // keeps the button at the bottom of a phone's full-screen dialog.
    <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-5">
      <DialogTitle className="sr-only">
        {t(operation ? 'operations.form.editTitle' : 'operations.form.title')}
      </DialogTitle>

      <div className="flex items-center justify-between gap-3">
        <KindToggle value={kind} onChange={changeKind} />
        <DialogClose asChild>
          <button
            type="button"
            aria-label={t('common.close')}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X aria-hidden className="size-4" />
          </button>
        </DialogClose>
      </div>

      <div className="flex flex-col gap-3">
        <AmountInput
          value={amount}
          // Adding starts with the figure, a repeat too since amounts differ from time to time; opening one to
          // look at it should not raise the phone's keyboard
          autoFocus={!operation}
          onChange={setAmount}
          income={kind === 'INCOME'}
          currency={account.currency}
          invalid={!!errorOf('amount')}
        />
        <div className="flex flex-wrap items-center gap-2">
          {/* Opened from an account's page, the operation is that account's, so there is nothing to choose */}
          {!fixedAccount && (
            <AccountPill
              account={account}
              open={accountsOpen}
              onToggle={() => setAccountsOpen(!accountsOpen)}
              invalid={!!errorOf('accountId')}
            />
          )}
          <DateTimePicker
            workspaceId={workspace.id}
            value={occurredAt}
            onChange={setOccurredAt}
            invalid={!!errorOf('occurredAt')}
          />
        </div>
        {rowErrors.map((error) => (
          <span key={error} className="text-xs text-destructive">
            {error}
          </span>
        ))}
      </div>

      {/* Folded into its pill by default; opened, the card takes its place in the form until one is chosen */}
      {accountsOpen && (
        <AccountGrid
          workspaceId={workspace.id}
          accounts={accounts}
          value={account.id}
          onChange={(id) => {
            setAccount(accounts.find((each) => each.id === id)!)
            setAccountsOpen(false)
          }}
        />
      )}

      <div className="flex flex-col gap-2">
        <CategoryGrid
          workspaceId={workspace.id}
          categories={categories}
          kind={kind}
          value={categoryId}
          onChange={setCategoryId}
        />
        {errorOf('categoryId') && <span className="text-xs text-destructive">{errorOf('categoryId')}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Pencil
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={t('operations.form.comment')}
            aria-invalid={!!errorOf('comment')}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('operations.form.commentPlaceholder')}
            maxLength={255}
            autoComplete="off"
            className="h-10 rounded-full border-transparent bg-card pl-9"
          />
        </div>
        {errorOf('comment') && <span className="text-xs text-destructive">{errorOf('comment')}</span>}
      </div>

      {failure && !hasFieldErrors(failure) && <Problem error={failure} />}
      {/* Pinned to the bottom when the form scrolls. Reaches the dialog's edges and holds its bottom padding,
          so the form scrolls behind it and never shows beneath; the fade above says there is more under it */}
      <div className="sticky bottom-0 -mx-4 mt-auto bg-(--ws-soft) px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-linear-to-t before:from-(--ws-soft) before:to-transparent">
        {operation && confirming ? (
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 text-sm font-semibold">{t('operations.form.deleteConfirm')}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
              className="h-12 rounded-xl border-transparent bg-card px-4"
            >
              {t('operations.form.keep')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(operation.id, { onSuccess: onDone })}
              className="h-12 rounded-xl px-4 font-bold"
            >
              {t(cancel.isPending ? 'operations.form.deleting' : 'operations.form.delete')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {operation && (
              <Button
                type="button"
                variant="outline"
                aria-label={t('operations.form.delete')}
                onClick={() => setConfirming(true)}
                className="size-12 shrink-0 rounded-xl border-transparent bg-card text-destructive"
              >
                <Trash2 aria-hidden />
              </Button>
            )}
            <Button
              type="submit"
              disabled={save.isPending}
              className="h-12 min-w-0 flex-1 bg-(--ws) font-bold text-white hover:bg-(--ws)/85"
            >
              {operation
                ? t(save.isPending ? 'operations.form.saving' : 'operations.form.save')
                : save.isPending
                  ? t('operations.form.adding')
                  : t(`operations.form.submit.${kind}`)}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}

// Two radios drawn as one switch: the keyboard's arrows move between them, as with any radio group
function KindToggle({ value, onChange }: { value: CategoryKind; onChange: (kind: CategoryKind) => void }) {
  const { t } = useTranslation()
  return (
    <fieldset className="inline-grid grid-cols-2 gap-1 rounded-xl bg-card p-1">
      <legend className="sr-only">{t('operations.form.kind')}</legend>
      {(['EXPENSE', 'INCOME'] as const).map((kind) => (
        <label
          key={kind}
          className="flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold text-muted-foreground has-checked:bg-(--ws) has-checked:text-white has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
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

// The form's one large figure, in a white field on the tint. The sign is drawn from the kind, never typed: the
// wire carries a magnitude.
function AmountInput({
  value,
  autoFocus,
  onChange,
  income,
  currency,
  invalid,
}: {
  value: string
  autoFocus: boolean
  onChange: (value: string) => void
  income: boolean
  currency: string
  invalid: boolean
}) {
  const { t } = useTranslation()
  return (
    // A white card like the categories' below, borderless; its ring is the wrapper's, so it turns red by what
    // the input inside reports
    <div
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-2xl bg-card px-4 py-2 text-4xl font-extrabold tracking-tight tabular-nums',
        'focus-within:ring-3 focus-within:ring-ring/30',
        'has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/40',
        'has-user-invalid:ring-3 has-user-invalid:ring-destructive/40',
        income && 'text-positive',
      )}
    >
      {/* The sign goes with the figure: the placeholder's shade while there is none, the figure's colour
          once typed, so "−0.00" and "−333" each read as one */}
      <span aria-hidden className={cn(!value && 'text-muted-foreground/40')}>
        {income ? '+' : '−'}
      </span>
      <input
        aria-label={t('operations.form.amount')}
        autoFocus={autoFocus}
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
        className="h-14 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/40"
      />
      <span className="shrink-0 text-2xl font-semibold text-muted-foreground">
        {currencySymbol(currency)}
      </span>
    </div>
  )
}

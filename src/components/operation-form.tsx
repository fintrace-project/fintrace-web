import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AccountGrid, AccountPill } from '@/components/account-grid'
import { AmountInput } from '@/components/amount-input'
import { Pending } from '@/components/cards'
import { CategoryGrid } from '@/components/category-grid'
import { CommentInput } from '@/components/comment-input'
import { DateTimePicker } from '@/components/date-time-picker'
import { FormHeader, type FormKind } from '@/components/form-header'
import { LoadError } from '@/components/load-error'
import { Problem } from '@/components/problem'
import { TransferForm } from '@/components/transfer-form'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  fieldError,
  hasFieldErrors,
  type Account,
  type Category,
  type CategoryKind,
  type OperationFeedItem,
  type TransferFeedItem,
  type Workspace,
} from '@/core/api'
import { othersOf } from '@/core/categories'
import { nowLocal, outsideGap } from '@/core/dates'
import { toDecimal } from '@/core/decimal'
import { formatDateTime } from '@/core/format'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useCreateOperation, useReviseOperation } from '@/hooks/use-operation-mutations'
import { formStrip } from '@/lib/form-strip'

export interface FormProps {
  workspace: Workspace
  accountId: string | undefined
  // The one to edit, as the feed has it; adding when absent
  operation: OperationFeedItem | undefined
  // Adding, filled from this one but dated now: a repeat of it
  template: OperationFeedItem | undefined
  // The transfer to edit, opening the transfer form
  transfer: TransferFeedItem | undefined
  // Adding a transfer filled from this one but dated now
  transferTemplate: TransferFeedItem | undefined
  // Adding the operation that books an anchor's unexplained difference (§4.6)
  compensation: Compensation | undefined
  onDone: () => void
}

// Core's magnitude, the kind its sign says, the instant just before the anchor, and the gap it books: from the
// previous anchor, if any, to this one
export interface Compensation {
  amount: number
  kind: CategoryKind
  occurredAt: string
  anchorAt: string
  previousAt: string | undefined
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
  return <FormOfKind {...props} accounts={open} categories={categories.data} />
}

// Adding offers both forms under one switch; what was typed crosses over with it
function FormOfKind(props: FormProps & { accounts: Account[]; categories: Category[] }) {
  const [start, setStart] = useState<{ kind: FormKind; amount: string }>({ kind: 'EXPENSE', amount: '' })

  if (props.transfer || props.transferTemplate || start.kind === 'TRANSFER') {
    return (
      <TransferForm
        workspace={props.workspace}
        accountId={props.accountId}
        accounts={props.accounts}
        transfer={props.transfer}
        template={props.transferTemplate}
        amount={start.amount}
        onSwitch={(kind, amount) => setStart({ kind, amount })}
        onDone={props.onDone}
      />
    )
  }
  return (
    <OperationForm
      {...props}
      initialKind={start.kind as CategoryKind}
      initialAmount={start.amount}
      onTransfer={(amount) => setStart({ kind: 'TRANSFER', amount })}
    />
  )
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
  compensation,
  onDone,
  accounts,
  categories,
  initialKind,
  initialAmount,
  onTransfer,
}: FormProps & {
  accounts: Account[]
  categories: Category[]
  initialKind: CategoryKind
  initialAmount: string
  onTransfer: (amount: string) => void
}) {
  const create = useCreateOperation(workspace.id)
  const revise = useReviseOperation(workspace.id)
  const save = operation ? revise : create
  const { t } = useTranslation()
  // Editing starts from the operation as the feed shows it, a repeat from its template but dated now; the feed
  // never offers a transfer leg here
  const source = operation ?? template
  const startKind = compensation?.kind ?? initialKind
  const [kind, setKind] = useState<CategoryKind>(
    source ? (source.kind === 'INCOME' ? 'INCOME' : 'EXPENSE') : startKind,
  )
  const [amount, setAmount] = useState(
    source ? String(source.amount) : compensation ? String(compensation.amount) : initialAmount,
  )
  const [account, setAccount] = useState(
    accounts.find((each) => each.id === (source?.accountId ?? accountId)) ?? accounts[0]!,
  )
  const [categoryId, setCategoryId] = useState(
    source?.categoryId ?? othersOf(categories, startKind)?.id ?? '',
  )
  const [occurredAt, setOccurredAt] = useState(
    () => operation?.occurredAt.slice(0, 16) ?? compensation?.occurredAt ?? nowLocal(),
  )
  const [comment, setComment] = useState(source?.comment ?? '')
  const [accountsOpen, setAccountsOpen] = useState(false)
  // Delete asks once more in the button row itself, rather than in a second dialog over this one

  const errorOf = (field: string) => fieldError(save.error, field)
  const fixedAccount = account.id === accountId
  const outside = compensation && outsideGap(occurredAt, compensation.anchorAt, compensation.previousAt)

  // The picker works to the minute: back on the preset's own one, the preset's microseconds return, or a
  // previous anchor earlier in that minute would take the operation into its gap
  const changeOccurredAt = (next: string) =>
    setOccurredAt(
      compensation && next === compensation.occurredAt.slice(0, 16) ? compensation.occurredAt : next,
    )
  // The amount and the pills carry no message of their own; Core's for them is listed under the pills
  const rowErrors = ['amount', 'accountId', 'occurredAt'].flatMap((field) => errorOf(field) ?? [])

  const changeKind = (next: FormKind) => {
    if (next === 'TRANSFER') {
      onTransfer(amount)
      return
    }
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

  const failure = save.error

  return (
    // min-w-0: a grid or flex item is otherwise as wide as its widest content. flex-1 with the button's mt-auto
    // keeps the button at the bottom of a phone's full-screen dialog.
    <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-5">
      <DialogTitle className="sr-only">
        {t(operation ? 'operations.form.editTitle' : 'operations.form.title')}
      </DialogTitle>

      {/* A compensation stays on its account, so it is never a transfer */}
      <FormHeader value={kind} onChange={changeKind} withTransfer={!source && !compensation} />

      <div className="flex flex-col gap-3">
        <AmountInput
          label={t('operations.form.amount')}
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
              label={t('operations.form.account')}
              account={account}
              open={accountsOpen}
              onToggle={() => setAccountsOpen(!accountsOpen)}
              invalid={!!errorOf('accountId')}
            />
          )}
          <DateTimePicker
            workspaceId={workspace.id}
            value={occurredAt}
            onChange={changeOccurredAt}
            invalid={!!errorOf('occurredAt')}
            fill={!!fixedAccount}
          />
        </div>
        {/* A warning, not a refusal: moving it out of the gap may be meant */}
        {compensation && outside && (
          <span role="status" className="text-xs text-muted-foreground">
            {t(`operations.form.outsideGap.${outside}`, {
              at: formatDateTime(outside === 'AFTER' ? compensation.anchorAt : compensation.previousAt!),
            })}
          </span>
        )}
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

      <CommentInput value={comment} onChange={setComment} error={errorOf('comment')} />

      {failure && !hasFieldErrors(failure) && <Problem error={failure} />}
      <div className={formStrip}>
        <div className="flex gap-2">
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
      </div>
    </form>
  )
}

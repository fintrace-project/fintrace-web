import { ArrowLeftRight, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AccountGrid, AccountPill } from '@/components/account-grid'
import { AmountInput } from '@/components/amount-input'
import { CommentInput } from '@/components/comment-input'
import { DateTimePicker } from '@/components/date-time-picker'
import { FormHeader, type FormKind } from '@/components/form-header'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { hasFieldErrors, problemOf, type Account, type TransferFeedItem, type Workspace } from '@/core/api'
import { nowLocal } from '@/core/dates'
import { impliedRate, toDecimal } from '@/core/decimal'
import { formatRate } from '@/core/format'
import { useCancelTransfer, useCreateTransfer, useReviseTransfer } from '@/hooks/use-transfer-mutations'
import { formStrip } from '@/lib/form-strip'

interface TransferProps {
  workspace: Workspace
  // On an account's page that account is the source
  accountId: string | undefined
  accounts: Account[]
  // The one to edit, as the feed has it; adding when absent
  transfer?: TransferFeedItem
  // Adding, filled from this one but dated now: a repeat of it
  template?: TransferFeedItem
  // What was typed before switching to a transfer, carried either way
  amount: string
  onSwitch: (kind: FormKind, amount: string) => void
  onDone: () => void
}

export function TransferForm(props: TransferProps) {
  const { t } = useTranslation()
  if (props.accounts.length < 2) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <DialogTitle className="sr-only">{t('transfers.form.title')}</DialogTitle>
        <FormHeader value="TRANSFER" onChange={(kind) => props.onSwitch(kind, props.amount)} withTransfer />
        <DialogDescription>{t('transfers.form.needTwoAccounts')}</DialogDescription>
        <DialogFooter>
          <Button asChild className="h-11 font-bold md:h-9">
            <Link to={`/w/${props.workspace.id}/accounts`}>{t('operations.form.toAccounts')}</Link>
          </Button>
        </DialogFooter>
      </div>
    )
  }
  return <TransferFields {...props} />
}

function TransferFields({
  workspace,
  accountId,
  accounts,
  transfer,
  template,
  amount: typed,
  onSwitch,
  onDone,
}: TransferProps) {
  const create = useCreateTransfer(workspace.id)
  const revise = useReviseTransfer(workspace.id)
  const cancel = useCancelTransfer(workspace.id)
  const save = transfer ? revise : create
  const { t } = useTranslation()
  const filled = transfer ?? template
  const [source, setSource] = useState(
    accounts.find((each) => each.id === (filled?.source.accountId ?? accountId)) ?? accounts[0]!,
  )
  const [target, setTarget] = useState(
    accounts.find((each) => each.id === filled?.target.accountId) ??
      accounts.find((each) => each.id !== source.id)!,
  )
  const [amount, setAmount] = useState(filled ? String(filled.source.amount) : typed)
  const [received, setReceived] = useState(filled ? String(filled.target.amount) : '')
  const [occurredAt, setOccurredAt] = useState(() => transfer?.occurredAt.slice(0, 16) ?? nowLocal())
  const [comment, setComment] = useState(filled?.comment ?? '')
  const [picking, setPicking] = useState<'source' | 'target'>()
  const [confirming, setConfirming] = useState(false)
  // An imported transfer can move different figures in one currency; one field would overwrite the second
  const [uneven] = useState(
    filled !== undefined &&
      filled.source.currency === filled.target.currency &&
      filled.source.amount !== filled.target.amount,
  )

  const twoAmounts = uneven || source.currency !== target.currency
  const rate = twoAmounts ? impliedRate(amount, received) : null
  const fieldErrors = problemOf(save.error)?.errors?.map((each) => each.message) ?? []
  const failure = save.error ?? cancel.error

  const swap = () => {
    setSource(target)
    setTarget(source)
    if (twoAmounts) {
      setAmount(received)
      setReceived(amount)
    }
  }

  // Choosing the account already on the other side swaps them, since the two must differ
  const pick = (id: string) => {
    const chosen = accounts.find((each) => each.id === id)!
    if (picking === 'source') {
      if (chosen.id === target.id) {
        setTarget(source)
      }
      setSource(chosen)
    } else {
      if (chosen.id === source.id) {
        setSource(target)
      }
      setTarget(chosen)
    }
    setPicking(undefined)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const body = {
      occurredAt,
      source: { accountId: source.id, amount: toDecimal(amount) ?? 0 },
      // One figure typed in one currency is the same figure on both legs
      target: { accountId: target.id, amount: toDecimal(twoAmounts ? received : amount) ?? 0 },
      comment: comment.trim() || null,
    }
    if (transfer) {
      revise.mutate({ transferId: transfer.id, body }, { onSuccess: onDone })
    } else {
      create.mutate(body, { onSuccess: onDone })
    }
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 flex-col gap-5">
      <DialogTitle className="sr-only">
        {t(transfer ? 'transfers.form.editTitle' : 'transfers.form.title')}
      </DialogTitle>
      <FormHeader
        value="TRANSFER"
        onChange={(kind) => onSwitch(kind, amount)}
        withTransfer
        transferOnly={filled !== undefined}
      />

      <div className="flex flex-col gap-3">
        <AmountInput
          label={t(twoAmounts ? 'transfers.form.amountSent' : 'transfers.form.amount')}
          value={amount}
          // Opening one to look at it should not raise the phone's keyboard
          autoFocus={!transfer}
          onChange={setAmount}
          income={false}
          unsigned={!twoAmounts}
          currency={source.currency}
          invalid={false}
        />
        {twoAmounts && (
          <AmountInput
            label={t('transfers.form.amountReceived')}
            value={received}
            autoFocus={false}
            onChange={setReceived}
            income
            currency={target.currency}
            invalid={false}
          />
        )}
        {rate !== null && (
          <span className="text-xs text-muted-foreground">{t('feed.rate', { rate: formatRate(rate) })}</span>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <AccountPill
            label={t('transfers.form.from')}
            account={source}
            open={picking === 'source'}
            onToggle={() => setPicking(picking === 'source' ? undefined : 'source')}
            invalid={false}
          />
          <button
            type="button"
            aria-label={t('transfers.form.swap')}
            onClick={swap}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeftRight aria-hidden className="size-4" />
          </button>
          <AccountPill
            label={t('transfers.form.to')}
            account={target}
            open={picking === 'target'}
            onToggle={() => setPicking(picking === 'target' ? undefined : 'target')}
            invalid={false}
          />
          <DateTimePicker
            workspaceId={workspace.id}
            value={occurredAt}
            onChange={setOccurredAt}
            invalid={false}
          />
        </div>
        {/* Core's words for whichever field it refused, listed together as the pills carry no message */}
        {fieldErrors.map((error) => (
          <span key={error} className="text-xs text-destructive">
            {error}
          </span>
        ))}
      </div>

      {picking && (
        <AccountGrid
          workspaceId={workspace.id}
          accounts={accounts}
          value={picking === 'source' ? source.id : target.id}
          onChange={pick}
        />
      )}

      <CommentInput value={comment} onChange={setComment} error={undefined} />

      {failure && !hasFieldErrors(failure) && <Problem error={failure} />}
      <div className={formStrip}>
        {transfer && confirming ? (
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 text-sm font-semibold">{t('transfers.form.deleteConfirm')}</span>
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
              onClick={() => cancel.mutate(transfer.id, { onSuccess: onDone })}
              className="h-12 rounded-xl px-4 font-bold"
            >
              {t(cancel.isPending ? 'operations.form.deleting' : 'operations.form.delete')}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {transfer && (
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
              {transfer
                ? t(save.isPending ? 'operations.form.saving' : 'operations.form.save')
                : t(save.isPending ? 'operations.form.adding' : 'transfers.form.submit')}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}

import { ArrowRightLeft } from 'lucide-react'
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
import { useCreateTransfer, useReviseTransfer } from '@/hooks/use-transfer-mutations'
import { formStrip } from '@/lib/form-strip'
import { cn } from '@/lib/utils'

const capsuleHalf = 'flex-1 basis-0 justify-between bg-transparent focus-visible:ring-inset'
// As the kind switch marks what is chosen: the tint would vanish into the page around the capsule
const capsuleHalfOpen = 'bg-(--ws) text-white [&>svg]:text-white'

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
  // Half-turns of the swap arrow, so each press visibly does something
  const [turns, setTurns] = useState(0)
  const [comment, setComment] = useState(filled?.comment ?? '')
  const [picking, setPicking] = useState<'source' | 'target'>()
  // An imported transfer can move different figures in one currency; one field would overwrite the second
  const [uneven] = useState(
    filled !== undefined &&
      filled.source.currency === filled.target.currency &&
      filled.source.amount !== filled.target.amount,
  )

  const twoAmounts = uneven || source.currency !== target.currency
  const rate = twoAmounts ? impliedRate(amount, received) : null
  const fieldErrors = problemOf(save.error)?.errors?.map((each) => each.message) ?? []
  const failure = save.error

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
        {/* One capsule, one setting: from → to. Each half tints while its account is being picked below */}
        <div className="flex items-center rounded-full bg-card">
          <AccountPill
            label={t('transfers.form.from')}
            account={source}
            open={picking === 'source'}
            onToggle={() => setPicking(picking === 'source' ? undefined : 'source')}
            invalid={false}
            className={cn(capsuleHalf, picking === 'source' && capsuleHalfOpen)}
          />
          <button
            type="button"
            aria-label={t('transfers.form.swap')}
            title={t('transfers.form.swap')}
            onClick={() => {
              swap()
              setTurns(turns + 1)
            }}
            className="group flex size-11 shrink-0 items-center justify-center rounded-full outline-none md:size-9 [&:focus-visible>span]:ring-3 [&:focus-visible>span]:ring-ring/50"
          >
            <span className="flex size-8 items-center justify-center rounded-full transition-colors group-hover:bg-muted group-active:bg-muted md:size-7">
              <ArrowRightLeft
                aria-hidden
                style={{ rotate: `${turns * 180}deg` }}
                className="size-4 transition-[rotate] duration-200 motion-reduce:transition-none"
              />
            </span>
          </button>
          <AccountPill
            label={t('transfers.form.to')}
            account={target}
            open={picking === 'target'}
            onToggle={() => setPicking(picking === 'target' ? undefined : 'target')}
            invalid={false}
            className={cn(capsuleHalf, picking === 'target' && capsuleHalfOpen)}
          />
        </div>
        {picking && (
          <AccountGrid
            workspaceId={workspace.id}
            accounts={accounts}
            value={picking === 'source' ? source.id : target.id}
            onChange={pick}
          />
        )}
        <DateTimePicker
          workspaceId={workspace.id}
          value={occurredAt}
          onChange={setOccurredAt}
          invalid={false}
          fill
        />
        {/* Core's words for whichever field it refused, listed together as the pills carry no message */}
        {fieldErrors.map((error) => (
          <span key={error} className="text-xs text-destructive">
            {error}
          </span>
        ))}
      </div>

      <CommentInput value={comment} onChange={setComment} error={undefined} />

      {failure && !hasFieldErrors(failure) && <Problem error={failure} />}
      <div className={formStrip}>
        <div className="flex gap-2">
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
      </div>
    </form>
  )
}

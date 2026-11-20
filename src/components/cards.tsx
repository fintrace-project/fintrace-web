import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BalanceWidget } from '@/components/balance-widget'
import type { CurrencyAmount, TopCategories, Workspace } from '@/core/api'
import { cashflowOf } from '@/core/charts/windows'
import { Link } from 'react-router'
import type { CashflowPoint } from '@/core/charts/cashflow-chart'
import { formatMoney, formatMonth, initials, splitMoney } from '@/core/format'
import { useYearOfMonths } from '@/hooks/use-cashflow'
import { useCategories } from '@/hooks/use-categories'
import { useTopCategories } from '@/hooks/use-top-categories'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-5', className)}>
      <div className="flex min-h-9 items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Pending({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

type Side = 'income' | 'expense'

const TOP_CATEGORIES = 4

const amountIn = (amounts: { byCurrency: CurrencyAmount[] }, currency: string) =>
  amounts.byCurrency.find((amount) => amount.currency === currency)?.total

function BreakdownRow({ label, amount, style }: { label: string; amount: string; style?: CSSProperties }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        style={style}
        className={cn('size-2 shrink-0 rounded-full', style ? 'bg-(--ws)' : 'bg-muted-foreground/30')}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="whitespace-nowrap tabular-nums">{amount}</span>
    </li>
  )
}

// A side's top categories as Core ranked them: each segment sized by its own total through flex-grow, so the
// browser divides the bar and no share is computed here, Core's "other" last
function CategoryBreakdown({
  workspaceId,
  side,
  top,
  currency,
}: {
  workspaceId: string
  side: Side
  top: TopCategories
  currency: string
}) {
  const { t } = useTranslation()
  const categories = useCategories(workspaceId).data
  const income = side === 'income'
  const rows = top.rows.flatMap((row) => {
    const total = amountIn(row.total, currency)
    return total ? [{ id: row.categoryId, total }] : []
  })
  const other = amountIn(top.other, currency)

  if (rows.length === 0) {
    return (
      <>
        <div aria-hidden className="h-1.5 rounded-full bg-muted" />
        <p className="text-xs text-muted-foreground">{t(income ? 'totals.noIncome' : 'totals.noExpenses')}</p>
      </>
    )
  }
  return (
    <>
      <div aria-hidden className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {rows.map((row) => (
          <span
            key={row.id}
            style={{ ...accentOf(row.id), flexGrow: row.total }}
            className="basis-0 bg-(--ws)"
          />
        ))}
        {other ? <span style={{ flexGrow: other }} className="basis-0 bg-muted-foreground/30" /> : null}
      </div>
      <ul
        aria-label={t(income ? 'totals.incomeByCategory' : 'totals.expensesByCategory')}
        className="flex flex-col gap-1.5 text-sm"
      >
        {rows.map((row) => (
          <BreakdownRow
            key={row.id}
            label={categories?.find((category) => category.id === row.id)?.name ?? ''}
            amount={formatMoney(row.total, currency)}
            style={accentOf(row.id)}
          />
        ))}
        {other ? <BreakdownRow label={t('totals.other')} amount={formatMoney(other, currency)} /> : null}
      </ul>
    </>
  )
}

// One side of the month: its label with the month's name, Core's figure for the month's bucket signed from its
// side as the feeds sign an operation, and under it its top categories
function MonthSide({
  workspaceId,
  side,
  month,
  currency,
}: {
  workspaceId: string
  side: Side
  month?: CashflowPoint
  currency: string
}) {
  const { t } = useTranslation()
  const income = side === 'income'
  const top = useTopCategories(workspaceId, income ? 'INCOME' : 'EXPENSE', currency, TOP_CATEGORIES)
  const figure = month && splitMoney(month[side], currency)
  const label = month
    ? t(income ? 'totals.incomeIn' : 'totals.expensesIn', { month: formatMonth(month.start) })
    : t(income ? 'totals.income' : 'totals.expenses')

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <h3 className="text-caption text-xs text-muted-foreground">{label}</h3>
      {figure ? (
        <p
          className={cn(
            'text-3xl leading-none font-extrabold tracking-tight whitespace-nowrap',
            income ? 'text-positive' : 'text-negative',
          )}
        >
          {income ? '+' : '−'}
          {figure.whole}
          <span className="text-xl opacity-60">{figure.fraction}</span>
        </p>
      ) : (
        <p aria-hidden className="text-3xl leading-none font-extrabold text-muted-foreground/40">
          —
        </p>
      )}
      {top.data ? (
        <CategoryBreakdown workspaceId={workspaceId} side={side} top={top.data} currency={currency} />
      ) : (
        <div aria-hidden className="h-1.5 rounded-full bg-muted" />
      )}
    </div>
  )
}

// This month's income beside its expenses, in the display currency
function MonthCard({ workspaceId, currency }: { workspaceId: string; currency: string }) {
  const { t } = useTranslation()
  const { cashflow } = useYearOfMonths(workspaceId)
  // The year's last bucket is this month's
  const month = cashflow.data && cashflowOf(cashflow.data, currency).at(-1)

  return (
    <section
      aria-label={t('totals.month')}
      className="flex flex-col gap-4 rounded-2xl border bg-card px-4 py-3"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <MonthSide workspaceId={workspaceId} side="income" month={month} currency={currency} />
        <MonthSide workspaceId={workspaceId} side="expense" month={month} currency={currency} />
      </div>
      <Link
        to={`/w/${workspaceId}/statistics`}
        className="mt-auto flex min-h-11 items-center self-start border-t pt-2 text-caption font-bold md:min-h-9"
      >
        {t('totals.allCategories')}
      </Link>
    </section>
  )
}

// The workspace's headline figures: the balance widget and this month's card side by side; on a phone, stacked
export function TotalsTiles({
  workspace,
  display,
  onPick,
}: {
  workspace: Workspace
  display: string
  onPick: (currency: string) => void
}) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={t('totals.label')}
      className="grid items-start gap-2 sm:gap-4 lg:grid-cols-2 lg:items-stretch"
    >
      <BalanceWidget workspace={workspace} display={display} onPick={onPick} />
      <MonthCard workspaceId={workspace.id} currency={display} />
    </section>
  )
}

// An account's or a category's own colour, picked by its id; the workspace's accent stays with the page around it
export function InitialsAvatar({
  name,
  colorId,
  className,
}: {
  name: string
  colorId: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={accentOf(colorId)}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-control bg-(--ws-soft) text-caption font-extrabold text-(--ws)',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

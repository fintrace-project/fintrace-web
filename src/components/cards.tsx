import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BalanceWidget } from '@/components/balance-widget'
import type { Workspace } from '@/core/api'
import { cashflowOf } from '@/core/charts/windows'
import { Link } from 'react-router'
import type { CashflowPoint } from '@/core/charts/cashflow-chart'
import { formatMonth, initials, splitMoney } from '@/core/format'
import { useYearOfMonths } from '@/hooks/use-cashflow'
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

// One side of the month: its label with the month's name, Core's figure for the month's bucket signed from its
// side as the feeds sign an operation, and under it the place its categories take with 3.8
function MonthSide({ side, month, currency }: { side: Side; month?: CashflowPoint; currency: string }) {
  const { t } = useTranslation()
  const income = side === 'income'
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
      {/* The categories' bar and rows: 3.8's rolled-up totals, the last row Core's own "other" */}
      <div aria-hidden className="h-1.5 rounded-full bg-muted" />
      <p className="text-xs text-muted-foreground">{t('totals.byCategoryPending')}</p>
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
        <MonthSide side="income" month={month} currency={currency} />
        <MonthSide side="expense" month={month} currency={currency} />
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

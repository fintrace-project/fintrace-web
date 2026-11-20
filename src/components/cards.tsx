import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BalanceWidget } from '@/components/balance-widget'
import { TopCategoriesList } from '@/components/top-categories'
import type { Workspace } from '@/core/api'
import { cashflowOf, monthSoFar } from '@/core/charts/windows'
import { isoDate } from '@/core/dates'
import { Link } from 'react-router'
import type { CashflowPoint } from '@/core/charts/cashflow-chart'
import { formatMonth, splitMoney } from '@/core/format'
import { useYearOfMonths } from '@/hooks/use-cashflow'
import { cn } from '@/lib/utils'

type Side = 'income' | 'expense'

const TOP_CATEGORIES = 4

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
  const [today] = useState(() => isoDate(new Date()))
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
      <TopCategoriesList
        workspaceId={workspaceId}
        kind={income ? 'INCOME' : 'EXPENSE'}
        currency={currency}
        limit={TOP_CATEGORIES}
        // The span of the cashflow bucket the headline shows, so the rows add up to it
        window={monthSoFar(today)}
        thisMonth
      />
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

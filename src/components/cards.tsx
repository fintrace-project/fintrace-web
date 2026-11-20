import { Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BalanceWidget } from '@/components/balance-widget'
import { CategoryBar, CategoryRow, type Segment } from '@/components/category-bar'
import { EntityIcon } from '@/components/entity-icon'
import type { TopCategories, Workspace } from '@/core/api'
import { amountIn } from '@/core/category-breakdown'
import { cashflowOf } from '@/core/charts/windows'
import { Link } from 'react-router'
import type { CashflowPoint } from '@/core/charts/cashflow-chart'
import { formatMoney, formatMonth, splitMoney } from '@/core/format'
import { useYearOfMonths } from '@/hooks/use-cashflow'
import { useCategories } from '@/hooks/use-categories'
import { useTopCategories } from '@/hooks/use-top-categories'
import { cn } from '@/lib/utils'

type Side = 'income' | 'expense'

const TOP_CATEGORIES = 4

// A side's top categories as Core ranked them, Core's "other" last
function MonthBreakdown({
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
        <CategoryBar segments={[]} />
        <p className="text-xs text-muted-foreground">{t(income ? 'totals.noIncome' : 'totals.noExpenses')}</p>
      </>
    )
  }
  const segments: Segment[] = rows.map((row) => ({ key: row.id, total: row.total, colorId: row.id }))
  return (
    <>
      <CategoryBar segments={other ? [...segments, { key: 'other', total: other }] : segments} />
      <ul
        aria-label={t(income ? 'totals.incomeByCategory' : 'totals.expensesByCategory')}
        className="flex flex-col gap-1.5 text-sm"
      >
        {rows.map((row) => {
          const category = categories?.find((each) => each.id === row.id)
          const name = category?.name ?? ''
          return (
            <CategoryRow
              key={row.id}
              label={name}
              amount={formatMoney(row.total, currency)}
              colorId={row.id}
              icon={
                <EntityIcon
                  entity={{ id: row.id, name, icon: category?.icon }}
                  className="size-6 rounded-full text-[0.625rem]"
                />
              }
            />
          )
        })}
        {other ? (
          <CategoryRow
            label={t('totals.other')}
            amount={formatMoney(other, currency)}
            icon={
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <Ellipsis className="size-3.5" />
              </span>
            }
          />
        ) : null}
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
        <MonthBreakdown workspaceId={workspaceId} side={side} top={top.data} currency={currency} />
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

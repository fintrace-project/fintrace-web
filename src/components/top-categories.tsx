import { Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CategoryBar, CategoryRow, type Segment } from '@/components/category-bar'
import { EntityIcon } from '@/components/entity-icon'
import type { CategoryKind } from '@/core/api'
import { amountIn } from '@/core/category-breakdown'
import type { DateWindow } from '@/core/charts/windows'
import { formatMoney } from '@/core/format'
import { useCategories } from '@/hooks/use-categories'
import { useTopCategories } from '@/hooks/use-top-categories'

// The `limit` largest top-level categories of one kind over a period as Core ranked them, Core's "other" last —
// the rest summed by Core, never here (3.8c)
export function TopCategoriesList({
  workspaceId,
  kind,
  currency,
  limit,
  window,
  thisMonth = false,
}: {
  workspaceId: string
  kind: CategoryKind
  currency: string
  limit: number
  // All time when absent
  window?: DateWindow
  // Says "this month" rather than "this period" when there is nothing
  thisMonth?: boolean
}) {
  const { t } = useTranslation()
  const top = useTopCategories(workspaceId, kind, currency, limit, window).data
  const categories = useCategories(workspaceId).data
  const income = kind === 'INCOME'

  if (!top) {
    return <CategoryBar segments={[]} />
  }
  const rows = top.rows.flatMap((row) => {
    const total = amountIn(row.total, currency)
    return total ? [{ id: row.categoryId, total }] : []
  })
  const other = amountIn(top.other, currency)

  if (rows.length === 0) {
    return (
      <>
        <CategoryBar segments={[]} />
        <p className="text-xs text-muted-foreground">
          {thisMonth
            ? t(income ? 'totals.noIncome' : 'totals.noExpenses')
            : t(income ? 'statistics.noIncome' : 'statistics.noExpenses')}
        </p>
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

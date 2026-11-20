import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBar, CategoryRow } from '@/components/category-bar'
import { DonutChartView } from '@/components/donut-chart'
import { EntityIcon } from '@/components/entity-icon'
import type { CategoryKind } from '@/core/api'
import { breakdownLevel } from '@/core/category-breakdown'
import { lineage } from '@/core/categories'
import type { DateWindow } from '@/core/charts/windows'
import { formatMoney } from '@/core/format'
import { useCategories } from '@/hooks/use-categories'
import { useCategoryTotals } from '@/hooks/use-category-totals'
import { accentColour } from '@/lib/accent'
import { cn } from '@/lib/utils'

// One level of a branch's breakdown over a period, in one currency: its total, the bar and a row per category.
// With onOpen a category with subcategories opens one level down and a breadcrumb leads back; without it the
// breakdown stays at the top level.
export function CategoryBreakdown({
  workspaceId,
  kind,
  currency,
  window,
  categoryId,
  onOpen,
}: {
  workspaceId: string
  kind: CategoryKind
  currency: string
  window?: DateWindow
  categoryId?: string
  onOpen?: (categoryId: string | undefined) => void
}) {
  const { t } = useTranslation()
  const totals = useCategoryTotals(workspaceId, kind, currency, window).data
  const categories = useCategories(workspaceId).data
  const income = kind === 'INCOME'
  const level = useMemo(
    () => totals && categories && breakdownLevel(totals.rows, categories, currency, categoryId),
    [totals, categories, currency, categoryId],
  )
  // Memoised with the level, so the donut is redrawn only when its figures change
  const slices = useMemo(
    () =>
      level?.rows.map((row) => ({
        key: row.own ? `${row.categoryId}-own` : row.categoryId,
        name: row.own ? t('statistics.itself', { name: row.name }) : row.name,
        value: row.total,
        colour: accentColour(row.categoryId),
      })) ?? [],
    [level, t],
  )

  if (!totals || !categories) {
    return <CategoryBar segments={[]} />
  }
  const path = onOpen && categoryId ? lineage(categories, categoryId) : []
  const drills = !!onOpen && !!level?.rows.some((row) => row.drillable)

  return (
    <div className="flex flex-col gap-3">
      {onOpen && path.length > 0 && (
        <nav aria-label={t('statistics.path')}>
          <ol className="flex flex-wrap items-center gap-1 text-sm">
            <li>
              <button
                type="button"
                onClick={() => onOpen(undefined)}
                className="inline-flex min-h-11 items-center font-bold hover:underline md:min-h-9"
              >
                {t(income ? 'statistics.allIncome' : 'statistics.allExpenses')}
              </button>
            </li>
            {path.map((category, at) => (
              <li key={category.id} className="flex items-center gap-1">
                <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                {at < path.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => onOpen(category.id)}
                    className="inline-flex min-h-11 items-center font-bold hover:underline md:min-h-9"
                  >
                    {category.name}
                  </button>
                ) : (
                  <span aria-current="page">{category.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {level ? (
        <>
          <p className="text-2xl leading-none font-extrabold tracking-tight tabular-nums">
            {formatMoney(level.total, currency)}
          </p>
          <CategoryBar
            segments={level.rows.map((row) => ({
              key: row.own ? `${row.categoryId}-own` : row.categoryId,
              total: row.total,
              colorId: row.categoryId,
            }))}
          />
          <DonutChartView slices={slices} currency={currency} />
          <ul
            aria-label={t(income ? 'totals.incomeByCategory' : 'totals.expensesByCategory')}
            className={cn('flex flex-col text-sm', drills ? 'gap-0' : 'gap-1.5')}
          >
            {level.rows.map((row) => (
              <CategoryRow
                key={row.own ? `${row.categoryId}-own` : row.categoryId}
                label={row.own ? t('statistics.itself', { name: row.name }) : row.name}
                amount={formatMoney(row.total, currency)}
                colorId={row.categoryId}
                icon={
                  <EntityIcon
                    entity={{
                      id: row.categoryId,
                      name: row.name,
                      icon: categories.find((category) => category.id === row.categoryId)?.icon,
                    }}
                    className="size-8 rounded-full text-xs"
                  />
                }
                onOpen={onOpen && row.drillable ? () => onOpen(row.categoryId) : undefined}
                drillList={drills}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t(income ? 'statistics.noIncome' : 'statistics.noExpenses')}
        </p>
      )}
    </div>
  )
}

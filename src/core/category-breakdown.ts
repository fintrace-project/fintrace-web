import type { Category, CategoryTotal, CurrencyAmount } from '@/core/api'

export const amountIn = (amounts: { byCurrency: CurrencyAmount[] }, currency: string) =>
  amounts.byCurrency.find((amount) => amount.currency === currency)?.total

export interface BreakdownRow {
  categoryId: string
  name: string
  total: number
  // The level's own money beside its subcategories (§11.2), shown as "<name> itself"
  own: boolean
  // Has subcategories with money in this currency, so it opens one level down
  drillable: boolean
}

export interface BreakdownLevel {
  categoryId: string
  total: number
  rows: BreakdownRow[]
}

const largestFirst = (a: BreakdownRow, b: BreakdownRow) =>
  a.total === b.total ? a.name.localeCompare(b.name) : a.total > b.total ? -1 : 1

// One level of the breakdown, the branch's root when no category is given: its rolled-up total and a row per
// child with money in this currency, plus its own money when it has both. Core's figures as they come — the
// client groups and orders, never sums. Undefined when the level holds nothing in this currency.
export function breakdownLevel(
  totals: CategoryTotal[],
  categories: Category[],
  currency: string,
  categoryId?: string,
): BreakdownLevel | undefined {
  const at = totals.find((row) => (categoryId ? row.categoryId === categoryId : !row.parentId))
  const total = at && amountIn(at.total, currency)
  if (!at || !total) return undefined

  const nameOf = (id: string) => categories.find((category) => category.id === id)?.name ?? ''
  const childrenWithMoney = (parentId: string) =>
    totals.flatMap((row) => {
      const amount = row.parentId === parentId ? amountIn(row.total, currency) : undefined
      return amount ? [{ categoryId: row.categoryId, total: amount }] : []
    })

  const rows: BreakdownRow[] = childrenWithMoney(at.categoryId).map((child) => ({
    ...child,
    name: nameOf(child.categoryId),
    own: false,
    drillable: childrenWithMoney(child.categoryId).length > 0,
  }))
  const own = amountIn(at.selfTotal, currency)
  if (own && rows.length > 0) {
    rows.push({
      categoryId: at.categoryId,
      name: nameOf(at.categoryId),
      total: own,
      own: true,
      drillable: false,
    })
  }
  return { categoryId: at.categoryId, total, rows: rows.sort(largestFirst) }
}

import type { AccountFeedItem, WorkspaceFeedItem } from '@/core/api'

type FeedItem = WorkspaceFeedItem | AccountFeedItem
export type OperationItem = Extract<FeedItem, { type: 'OPERATION' }>
export type DifferenceItem = Extract<FeedItem, { type: 'DIFFERENCE' }>

export type FeedRow =
  { kind: 'ITEM'; item: FeedItem; difference?: DifferenceItem } | { kind: 'RUN'; items: OperationItem[] }

// The date is the caller's: it passes one day's items
const sameRun = (a: OperationItem, b: OperationItem) =>
  a.categoryId === b.categoryId &&
  a.accountId === b.accountId &&
  a.kind === b.kind &&
  a.currency === b.currency

// One day's items as the rows they show as: an anchor with its difference as one row, and consecutive
// operations of one category, account, kind and currency collapsed into a run. Anything else between
// them ends a run, so a difference is never hidden inside one.
export function feedRows(items: FeedItem[]): FeedRow[] {
  const rows: FeedRow[] = []
  for (const item of items) {
    const last = rows.at(-1)
    if (item.type === 'DIFFERENCE' && last?.kind === 'ITEM' && last.item.type === 'BALANCE_ANCHOR') {
      last.difference = item
    } else if (item.type === 'OPERATION' && last?.kind === 'RUN' && sameRun(last.items[0]!, item)) {
      last.items.push(item)
    } else if (
      item.type === 'OPERATION' &&
      last?.kind === 'ITEM' &&
      last.item.type === 'OPERATION' &&
      sameRun(last.item, item)
    ) {
      rows[rows.length - 1] = { kind: 'RUN', items: [last.item, item] }
    } else {
      rows.push({ kind: 'ITEM', item })
    }
  }
  return rows
}

// Core's amounts have four decimal places. Summed as integers, or adding floats would drift. For showing
// only: these are the only sums the client does, of what is on screen, and they are never sent anywhere.
const SCALE = 10_000

export const runTotal = (items: OperationItem[]) =>
  items.reduce((sum, item) => sum + Math.round(item.amount * SCALE), 0) / SCALE

// A day's income less its expenses, per currency, as statistics count them: transfers are left out
export function dayTotals(items: FeedItem[]): { currency: string; amount: number }[] {
  const totals = new Map<string, number>()
  for (const item of items) {
    if (item.type === 'OPERATION') {
      const amount = Math.round(item.amount * SCALE) * (item.kind === 'INCOME' ? 1 : -1)
      totals.set(item.currency, (totals.get(item.currency) ?? 0) + amount)
    }
  }
  return [...totals].map(([currency, total]) => ({ currency, amount: total / SCALE }))
}

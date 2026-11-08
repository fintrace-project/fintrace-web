import type { CategoryKind, OperationFeedItem, WorkspaceFeedItem } from '@/core/api'

// Recent use read from the feed pages already loaded, the latest entry first. A stand-in until Core sorts
// by `touched_at` (4.15): it sees only what is loaded, and an import's operations share one `recordedAt`.

const latestEntered = (items: WorkspaceFeedItem[], keep: (item: OperationFeedItem) => boolean) =>
  items
    .flatMap((item) => (item.type === 'OPERATION' && keep(item) ? [item] : []))
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))

const distinct = (ids: string[], limit: number) => [...new Set(ids)].slice(0, limit)

export const recentCategoryIds = (items: WorkspaceFeedItem[], kind: CategoryKind, limit: number) =>
  distinct(
    latestEntered(items, (item) => item.kind === kind).map((item) => item.categoryId),
    limit,
  )

export const recentAccountIds = (items: WorkspaceFeedItem[], limit: number) =>
  distinct(
    latestEntered(items, () => true).map((item) => item.accountId),
    limit,
  )

// Those used recently first, in the order of their last use; the rest after them, as given
export function recentFirst<T extends { id: string }>(items: T[], recentIds: string[]): T[] {
  const rank = (item: T) => {
    const at = recentIds.indexOf(item.id)
    return at < 0 ? recentIds.length : at
  }
  return [...items].sort((a, b) => rank(a) - rank(b))
}

// The first `count`, keeping the chosen one in view: in the last place when it is not among them already
export function withChosen<T extends { id: string }>(items: T[], chosen: T | undefined, count: number): T[] {
  const first = items.slice(0, count)
  return chosen && !first.some((item) => item.id === chosen.id)
    ? [...first.slice(0, count - 1), chosen]
    : first
}

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

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dataOf, type PageCursors } from '@/core/api'
import { addDays } from '@/core/dates'

// The pages held at once: the reader's and its neighbours. Returning to the tab re-reads exactly these,
// so its cost does not grow with how far the reader scrolled; a page reached by scrolling is fetched fresh.
const FEED_WINDOW = 3

type FeedSeek = { older?: string; newer?: string; at?: string }

const paging = {
  initialPageParam: {} as FeedSeek,
  getNextPageParam: ({ page }: { page: PageCursors }): FeedSeek | undefined =>
    page.older ? { older: page.older } : undefined,
  getPreviousPageParam: ({ page }: { page: PageCursors }): FeedSeek | undefined =>
    page.newer ? { newer: page.newer } : undefined,
  maxPages: FEED_WINDOW,
  // Not polled: a change made elsewhere shows when the reader comes back to the tab, which TanStack
  // Query refetches on by default (refetchOnWindowFocus), or opens the page
}

// A day's feed is a query of its own beside the whole one, under the workspace's key so every write refreshes it
const workspaceFeedKey = (workspaceId: string, day?: string) =>
  day ? ['workspaces', workspaceId, 'feed', day] : ['workspaces', workspaceId, 'feed']
const accountFeedKey = (workspaceId: string, accountId: string, at: string | undefined) => [
  'workspaces',
  workspaceId,
  'accounts',
  accountId,
  'feed',
  at ?? null,
]

// Back to the feed's first page. The window has dropped it by then, so this fetches it afresh rather
// than walking every page in between.
export function useResetFeed(workspaceId: string, accountId?: string, day?: string) {
  const queryClient = useQueryClient()
  const queryKey = accountId
    ? accountFeedKey(workspaceId, accountId, undefined)
    : workspaceFeedKey(workspaceId, day)
  return () => void queryClient.resetQueries({ queryKey, exact: true })
}

// With a day, that day's incomes and expenses alone: Core's window takes `from` and excludes `to`, so the next
// midnight ends it; transfers are left out, as the heatmap that opens it counts none
export function useWorkspaceFeed(workspaceId: string, day?: string) {
  const filter = day
    ? { from: `${day}T00:00:00`, to: `${addDays(day, 1)}T00:00:00`, kinds: ['OPERATION' as const] }
    : {}
  return useInfiniteQuery({
    ...paging,
    queryKey: workspaceFeedKey(workspaceId, day),
    queryFn: async ({ pageParam, signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/feed', {
          params: { path: { workspaceId }, query: { ...filter, ...pageParam } },
          signal,
        }),
      ),
  })
}

// `at` opens the feed with that item first; each position is a query of its own
export function useAccountFeed(workspaceId: string, accountId: string, at: string | undefined) {
  return useInfiniteQuery({
    ...paging,
    initialPageParam: (at ? { at } : {}) as FeedSeek,
    queryKey: accountFeedKey(workspaceId, accountId, at),
    queryFn: async ({ pageParam, signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/feed', {
          params: { path: { workspaceId, accountId }, query: pageParam },
          signal,
        }),
      ),
  })
}

function useNearestAnchor(
  workspaceId: string,
  accountId: string,
  direction: 'older' | 'newer',
  at: string | undefined,
) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'accounts', accountId, 'nearestAnchor', direction, at ?? null],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/feed', {
          params: {
            path: { workspaceId, accountId },
            query: { ...(at ? { [direction]: at } : {}), kinds: ['BALANCE_ANCHOR'], size: 1 },
          },
          signal,
        }),
      ),
    select: ({ items }) => items[0]?.cursor,
    // From the head of the feed nothing is newer
    enabled: direction === 'older' || at !== undefined,
  })
}

// The cursors the arrows lead to, each looked up with no page scanned (§10.5). Every recorded balance, a zero
// difference included; a difference sits under its anchor, so none is skipped. With no position yet the older
// one is the account's newest anchor.
export function useAnchorArrows(workspaceId: string, accountId: string, at: string | undefined) {
  const older = useNearestAnchor(workspaceId, accountId, 'older', at)
  const newer = useNearestAnchor(workspaceId, accountId, 'newer', at)
  return { older: older.data, newer: newer.data }
}

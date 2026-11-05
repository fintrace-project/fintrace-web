import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dataOf, type PageCursors } from '@/core/api'

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

const workspaceFeedKey = (workspaceId: string) => ['workspaces', workspaceId, 'feed']
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
export function useResetFeed(workspaceId: string, accountId?: string) {
  const queryClient = useQueryClient()
  const queryKey = accountId
    ? accountFeedKey(workspaceId, accountId, undefined)
    : workspaceFeedKey(workspaceId)
  return () => void queryClient.resetQueries({ queryKey, exact: true })
}

export function useWorkspaceFeed(workspaceId: string) {
  return useInfiniteQuery({
    ...paging,
    queryKey: workspaceFeedKey(workspaceId),
    queryFn: async ({ pageParam, signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/feed', {
          params: { path: { workspaceId }, query: pageParam },
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

function useNearestDifference(
  workspaceId: string,
  accountId: string,
  direction: 'older' | 'newer',
  at: string | undefined,
) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'accounts', accountId, 'nearestDifference', direction, at ?? null],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/feed', {
          params: {
            path: { workspaceId, accountId },
            query: { ...(at ? { [direction]: at } : {}), kinds: ['DIFFERENCE'], size: 1 },
          },
          signal,
        }),
      ),
    select: ({ items }) => items[0]?.cursor,
    // From the head of the feed nothing is newer
    enabled: direction === 'older' || at !== undefined,
  })
}

// The cursors the arrows lead to, each looked up with no page scanned (§10.5). With no position yet
// the older one is the account's newest difference.
export function useDifferenceArrows(workspaceId: string, accountId: string, at: string | undefined) {
  const older = useNearestDifference(workspaceId, accountId, 'older', at)
  const newer = useNearestDifference(workspaceId, accountId, 'newer', at)
  return { older: older.data, newer: newer.data }
}

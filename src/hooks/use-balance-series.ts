import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, dataOf, type Granularity } from '@/core/api'

export interface BalanceSeriesRequest {
  granularity: Granularity
  // Omitted, Core starts at the selection's first activity and ends today (§11.4)
  from?: string
  to?: string
  // One account, or every account when omitted
  accountId?: string
}

// The balance per currency at each bucket's end, computed by Core. Under the workspace's key, so every write
// refreshes it; the previous series stays on screen while a new granularity or window loads.
export function useBalanceSeries(
  workspaceId: string,
  { granularity, from, to, accountId }: BalanceSeriesRequest,
) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'balances', 'series', granularity, from, to, accountId],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/statistics/balances/series', {
          params: {
            path: { workspaceId },
            query: { granularity, from, to, accountIds: accountId ? [accountId] : undefined },
          },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

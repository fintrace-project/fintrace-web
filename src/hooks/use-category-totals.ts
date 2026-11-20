import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, dataOf, type CategoryKind } from '@/core/api'
import type { DateWindow } from '@/core/charts/windows'

// Every category of one kind with its own and rolled-up totals in one currency over a period, all time when
// none is given (§11.2). Under the workspace's key, so every write refreshes it; the previous period stays on
// screen while the next one loads.
export function useCategoryTotals(
  workspaceId: string,
  kind: CategoryKind,
  currency: string,
  window?: DateWindow,
) {
  const { from, to } = window ?? {}
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'category-totals', kind, currency, from, to],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/statistics/categories/totals', {
          params: { path: { workspaceId }, query: { kind, currency, from, to } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, dataOf, type CategoryKind } from '@/core/api'
import type { DateWindow } from '@/core/charts/windows'

// The largest top-level categories of one kind in one currency over a period — all time when none is given —
// the rest as Core's `other` (3.8c). Under the workspace's key, so every write refreshes it; the previous period
// stays on screen while the next loads.
export function useTopCategories(
  workspaceId: string,
  kind: CategoryKind,
  currency: string,
  limit: number,
  window?: DateWindow,
) {
  const { from, to } = window ?? {}
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'top-categories', kind, currency, limit, from, to],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/statistics/categories/top', {
          params: { path: { workspaceId }, query: { kind, currency, limit, from, to } },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

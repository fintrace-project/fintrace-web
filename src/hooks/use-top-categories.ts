import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api, dataOf, type CategoryKind } from '@/core/api'
import { monthSoFar } from '@/core/charts/windows'
import { isoDate } from '@/core/dates'

// This month's largest top-level categories of one kind in one currency, the rest as Core's `other` (3.8c).
// Under the workspace's key, so every write refreshes it.
export function useTopCategories(workspaceId: string, kind: CategoryKind, currency: string, limit: number) {
  const [today] = useState(() => isoDate(new Date()))
  const { from, to } = useMemo(() => monthSoFar(today), [today])
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'top-categories', kind, currency, limit, from, to],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/statistics/categories/top', {
          params: { path: { workspaceId }, query: { kind, currency, limit, from, to } },
          signal,
        }),
      ),
  })
}

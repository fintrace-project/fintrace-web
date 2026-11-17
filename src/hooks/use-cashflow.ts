import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api, dataOf } from '@/core/api'
import { yearOfMonths } from '@/core/charts/windows'
import { isoDate } from '@/core/dates'
import type { BalanceSeriesRequest } from '@/hooks/use-balance-series'

// Omitted, Core starts at the selection's first income or expense, never an anchor or a transfer (§11.4)
export type CashflowRequest = BalanceSeriesRequest

// Income, expense, net and the operations per currency in each bucket, and the period's totals, all Core's.
// Under the workspace's key, so every write refreshes it.
export function useCashflow(workspaceId: string, { granularity, from, to, accountId }: CashflowRequest) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'cashflow', granularity, from, to, accountId],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/statistics/cashflow', {
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

// The overview's year by month, read by its expenses panel and by its "this month" tiles: one request, the tiles
// taking the last bucket
export function useYearOfMonths(workspaceId: string) {
  const [today] = useState(() => isoDate(new Date()))
  const window = useMemo(() => yearOfMonths(today), [today])
  const cashflow = useCashflow(workspaceId, { granularity: 'MONTH', from: window.from, to: today })
  return { cashflow, window }
}

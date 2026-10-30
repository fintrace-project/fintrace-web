import { useQuery } from '@tanstack/react-query'
import { api, dataOf, type Account, type AccountBalance } from '@/core/api'

export function useAccounts(workspaceId: string) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'accounts'],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/accounts', {
          params: { path: { workspaceId } },
          signal,
        }),
      ),
  })
}

// One balance per account in its own currency, computed by Core
export function useAccountBalances(workspaceId: string) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'balances', 'accounts'],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/statistics/balances/accounts', {
          params: { path: { workspaceId } },
          signal,
        }),
      ),
  })
}

export interface AccountRow {
  account: Account
  balance: AccountBalance | undefined
}

// Accounts and their balances, fetched in parallel and matched by id
export function useAccountRows(workspaceId: string) {
  const accounts = useAccounts(workspaceId)
  const balances = useAccountBalances(workspaceId)

  let rows: AccountRow[] | undefined
  if (accounts.data && balances.data) {
    const balanceOf = new Map(balances.data.map((row) => [row.accountId, row]))
    rows = accounts.data.map((account) => ({ account, balance: balanceOf.get(account.id) }))
  }

  return {
    isPending: accounts.isPending || balances.isPending,
    error: accounts.error ?? balances.error,
    retry: () => {
      void accounts.refetch()
      void balances.refetch()
    },
    rows,
  }
}

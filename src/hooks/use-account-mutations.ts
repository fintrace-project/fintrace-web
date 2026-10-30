import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, dataOf, type Account } from '@/core/api'

export function useCreateAccount(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; currency: string; initialBalance: number | null }) =>
      dataOf(
        await api.POST('/api/v1/workspaces/{workspaceId}/accounts', {
          params: { path: { workspaceId } },
          body,
        }),
      ),
    // A refetch, not a cache edit: the balance is Core's to compute, and the first write moves a NEW
    // workspace to ACTIVE
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] })
      void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })
    },
  })
}

// Renaming, archiving and restoring leave the balance as it was, so the account Core answers with is all that changes
function replaceInList(queryClient: QueryClient, account: Account) {
  queryClient.setQueryData<Account[]>(['workspaces', account.workspaceId, 'accounts'], (list) =>
    list?.map((each) => (each.id === account.id ? account : each)),
  )
}

export function useRenameAccount(account: Account) {
  const queryClient = useQueryClient()
  return useMutation({
    // A PUT replaces the account, so the icon goes back as it was
    mutationFn: async (name: string) =>
      dataOf(
        await api.PUT('/api/v1/workspaces/{workspaceId}/accounts/{accountId}', {
          params: { path: { workspaceId: account.workspaceId, accountId: account.id } },
          body: { name, icon: account.icon },
        }),
      ),
    onSuccess: (renamed) => replaceInList(queryClient, renamed),
  })
}

export function useSetAccountArchived(account: Account) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (archived: boolean) => {
      const options = { params: { path: { workspaceId: account.workspaceId, accountId: account.id } } }
      return dataOf(
        archived
          ? await api.DELETE('/api/v1/workspaces/{workspaceId}/accounts/{accountId}', options)
          : await api.POST('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/restore', options),
      )
    },
    onSuccess: (changed) => replaceInList(queryClient, changed),
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, dataOf } from '@/core/api'

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

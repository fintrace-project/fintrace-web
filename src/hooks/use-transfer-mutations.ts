import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, dataOf, type CreateTransferRequest, type UpdateTransferRequest } from '@/core/api'
import { refetchWorkspace } from '@/hooks/use-operation-mutations'

export function useCreateTransfer(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateTransferRequest) =>
      dataOf(
        await api.POST('/api/v1/workspaces/{workspaceId}/transfers', {
          params: { path: { workspaceId } },
          body,
        }),
      ),
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

export function useReviseTransfer(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ transferId, body }: { transferId: string; body: UpdateTransferRequest }) =>
      dataOf(
        await api.PUT('/api/v1/workspaces/{workspaceId}/transfers/{transferId}', {
          params: { path: { workspaceId, transferId } },
          body,
        }),
      ),
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

// Cancels both legs at once (§10.3)
export function useCancelTransfer(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (transferId: string) => {
      await api.DELETE('/api/v1/workspaces/{workspaceId}/transfers/{transferId}', {
        params: { path: { workspaceId, transferId } },
      })
    },
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

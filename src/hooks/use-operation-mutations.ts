import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, dataOf, type CreateOperationRequest, type UpdateOperationRequest } from '@/core/api'

// A refetch, not a cache edit: an operation moves balances and both feeds, all Core's to compute, and the
// first write moves a NEW workspace to ACTIVE
export function refetchWorkspace(queryClient: QueryClient, workspaceId: string) {
  void queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId] })
  void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })
}

export function useCreateOperation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateOperationRequest) =>
      dataOf(
        await api.POST('/api/v1/workspaces/{workspaceId}/operations', {
          params: { path: { workspaceId } },
          body,
        }),
      ),
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

// The operation's id goes with each call rather than into the hook, so one form can hold the hook whether it
// adds or edits
export function useReviseOperation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ operationId, body }: { operationId: string; body: UpdateOperationRequest }) =>
      dataOf(
        await api.PUT('/api/v1/workspaces/{workspaceId}/operations/{operationId}', {
          params: { path: { workspaceId, operationId } },
          body,
        }),
      ),
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

// Cancels it (§10.2): gone from the feeds and every figure, never shown struck through
export function useCancelOperation(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (operationId: string) => {
      await api.DELETE('/api/v1/workspaces/{workspaceId}/operations/{operationId}', {
        params: { path: { workspaceId, operationId } },
      })
    },
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

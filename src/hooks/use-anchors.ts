import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, dataOf } from '@/core/api'
import { refetchWorkspace } from '@/hooks/use-operation-mutations'

// Under the workspace's key, so any write that moves a balance also re-reads the anchor's difference
const anchorsKey = (workspaceId: string, accountId: string) => [
  'workspaces',
  workspaceId,
  'accounts',
  accountId,
  'anchors',
]

// Newest first, as Core lists them, so the head is the one that may be deleted (§10.4) and each anchor's
// predecessor is the next one. Asked for nothing without an account, so the workspace's feed can hold it too.
export function useAnchors(workspaceId: string, accountId: string | undefined) {
  return useQuery({
    queryKey: anchorsKey(workspaceId, accountId ?? ''),
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/balance-anchors', {
          params: { path: { workspaceId, accountId: accountId! } },
          signal,
        }),
      ).items,
    enabled: accountId !== undefined,
  })
}

// Core dates it now; the value is what was counted, signed, a debt negative
export function useCreateAnchor(workspaceId: string, accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (value: number) =>
      dataOf(
        await api.POST('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/balance-anchors', {
          params: { path: { workspaceId, accountId } },
          body: { value },
        }),
      ),
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

export function useDeleteAnchor(workspaceId: string, accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (anchorId: string) => {
      await api.DELETE('/api/v1/workspaces/{workspaceId}/accounts/{accountId}/balance-anchors/{anchorId}', {
        params: { path: { workspaceId, accountId, anchorId } },
      })
    },
    onSuccess: () => refetchWorkspace(queryClient, workspaceId),
  })
}

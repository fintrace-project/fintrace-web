import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, dataOf, type Workspace } from '@/core/api'

// Core answers every surviving write with the workspace and its new version: put it in the list, no refetch
function replaceInList(queryClient: QueryClient, workspace: Workspace) {
  queryClient.setQueryData<Workspace[]>(['workspaces'], (list) =>
    list?.map((each) => (each.id === workspace.id ? workspace : each)),
  )
}

export function useEditWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { version: number; workspaceName: string; defaultCurrency: string }) =>
      dataOf(await api.PUT('/api/v1/workspaces/{workspaceId}', { params: { path: { workspaceId } }, body })),
    onSuccess: (workspace) => replaceInList(queryClient, workspace),
  })
}

export function useSetArchived(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (archived: boolean) => {
      const options = { params: { path: { workspaceId } } }
      return dataOf(
        archived
          ? await api.POST('/api/v1/workspaces/{workspaceId}/archive', options)
          : await api.DELETE('/api/v1/workspaces/{workspaceId}/archive', options),
      )
    },
    onSuccess: (workspace) => replaceInList(queryClient, workspace),
  })
}

export function useDeleteWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (version: number) => {
      await api.DELETE('/api/v1/workspaces/{workspaceId}', {
        params: { path: { workspaceId }, query: { version } },
      })
    },
    // A refetch rather than a cache edit: the caller navigates away first, so the page never sees its
    // workspace vanish and render "not found" for a moment
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['workspaces', workspaceId] })
      void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })
    },
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { workspaceName: string; defaultCurrency: string }) =>
      dataOf(await api.POST('/api/v1/workspaces', { body })),
    onSuccess: (workspace) =>
      queryClient.setQueryData<Workspace[]>(['workspaces'], (list) => list && [...list, workspace]),
  })
}

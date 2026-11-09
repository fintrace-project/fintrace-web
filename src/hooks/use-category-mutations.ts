import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, dataOf, type Category } from '@/core/api'

const listKey = (workspaceId: string) => ['workspaces', workspaceId, 'categories']

export function useCreateCategory(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; parentId: string }) =>
      dataOf(
        await api.POST('/api/v1/workspaces/{workspaceId}/categories', {
          params: { path: { workspaceId } },
          body,
        }),
      ),
    onSuccess: (created) => {
      queryClient.setQueryData<Category[]>(listKey(workspaceId), (list) => list?.concat(created))
      // The first write moves a NEW workspace to ACTIVE
      void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })
    },
  })
}

export function useReviseCategory(category: Category) {
  const queryClient = useQueryClient()
  return useMutation({
    // A PUT replaces the category, so whatever is not changing goes back as it was. Only a system root
    // has no parent
    mutationFn: async (change: { name: string } | { parentId: string }) =>
      dataOf(
        await api.PUT('/api/v1/workspaces/{workspaceId}/categories/{categoryId}', {
          params: { path: { workspaceId: category.workspaceId, categoryId: category.id } },
          body: { name: category.name, parentId: category.parentId!, icon: category.icon, ...change },
        }),
      ),
    onSuccess: (revised) =>
      queryClient.setQueryData<Category[]>(listKey(category.workspaceId), (list) =>
        list?.map((each) => (each.id === revised.id ? revised : each)),
      ),
  })
}

export function useArchiveCategory(category: Category) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      dataOf(
        await api.DELETE('/api/v1/workspaces/{workspaceId}/categories/{categoryId}', {
          params: { path: { workspaceId: category.workspaceId, categoryId: category.id } },
        }),
      ),
    // Refetched, as the response names only this category and its subtree went too. Not awaited: the caller's
    // own onSuccess has to run while the details of this category are still mounted
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey(category.workspaceId), exact: true })
    },
  })
}

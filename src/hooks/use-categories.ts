import { useQuery } from '@tanstack/react-query'
import { api, dataOf } from '@/core/api'

// Archived ones too, so an old operation keeps its category's name
export function useCategories(workspaceId: string) {
  return useQuery({
    queryKey: ['workspaces', workspaceId, 'categories'],
    queryFn: async ({ signal }) =>
      dataOf(
        await api.GET('/api/v1/workspaces/{workspaceId}/categories', {
          params: { path: { workspaceId }, query: { includeArchived: true } },
          signal,
        }),
      ),
  })
}

import { useQuery } from '@tanstack/react-query'
import { api, dataOf } from '@/core/api'

// Who is signed in, from Core (4.2g): names and email come from the token, so they change only at sign-in
export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'current'],
    queryFn: async ({ signal }) => dataOf(await api.GET('/api/v1/users/current', { signal })),
    staleTime: Infinity,
  })
}

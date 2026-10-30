import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listWorkspaces, type Workspace } from '@/core/api'

const visible = (workspaces: Workspace[]) => workspaces.filter((workspace) => workspace.status !== 'DELETED')

// One query shared by the rail, the sheet and the start page: TanStack Query fetches it once.
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: ({ signal }) => listWorkspaces(signal),
    select: visible,
  })
}

export function useWorkspace(workspaceId: string | undefined) {
  const workspaces = useWorkspaces()
  return workspaces.data?.find((workspace) => workspace.id === workspaceId)
}

// After a version conflict: fetch the list again, so the next write carries the current version
export function useReloadWorkspaces() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })
}

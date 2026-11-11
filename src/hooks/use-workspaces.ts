import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listWorkspaces, type Workspace } from '@/core/api'

const visible = (workspaces: Workspace[]) => workspaces.filter((workspace) => workspace.status !== 'DELETED')

// One query shared by the rail, the sheet and the start page: TanStack Query fetches it once.
export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: ({ signal }) => listWorkspaces(signal),
    select: visible,
    // The shell mounts this on every page, so its 401 on a return to the tab is the session check (§7.4)
    refetchOnWindowFocus: 'always',
  })
}

export function useWorkspace(workspaceId: string | undefined) {
  const workspaces = useWorkspaces()
  return workspaces.data?.find((workspace) => workspace.id === workspaceId)
}

// The workspace as read after `since`, re-read every 5 s until then and while an import still holds it: an
// upload whose answer never came learns how it ended from the status alone. Undefined until such a read.
export function useWorkspaceSince(workspaceId: string, since: number): Workspace | undefined {
  const query = useQuery({
    queryKey: ['workspaces'],
    queryFn: ({ signal }) => listWorkspaces(signal),
    refetchOnMount: 'always',
    refetchInterval: ({ state }) =>
      state.dataUpdatedAt < since ||
      state.data?.find((workspace) => workspace.id === workspaceId)?.status === 'IMPORTING'
        ? 5000
        : false,
  })
  return query.dataUpdatedAt >= since
    ? query.data?.find((workspace) => workspace.id === workspaceId)
    : undefined
}

// After a version conflict: fetch the list again, so the next write carries the current version
export function useReloadWorkspaces() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })
}

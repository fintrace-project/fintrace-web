import { Outlet, useParams } from 'react-router'
import { LoadError } from '@/components/load-error'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { NotFoundPage } from '@/pages/not-found'

// The route for one workspace: its pages render only once the id in the URL is known to be the caller's.
export function WorkspaceLayout() {
  const { workspaceId } = useParams()
  const workspaces = useWorkspaces()

  if (workspaces.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (workspaces.isError) {
    return <LoadError what="workspaces" error={workspaces.error} onRetry={() => workspaces.refetch()} />
  }
  if (!workspaces.data.some((workspace) => workspace.id === workspaceId)) {
    return <NotFoundPage />
  }
  return <Outlet />
}

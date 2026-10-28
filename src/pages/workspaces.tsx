import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { listWorkspaces, UnauthorizedError, type Workspace } from '@/core/api'

const statusLabel: Record<Workspace['status'], string> = {
  NEW: 'New',
  IMPORTING: 'Importing',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
}

export function WorkspacesPage() {
  const workspaces = useQuery({
    queryKey: ['workspaces'],
    queryFn: ({ signal }) => listWorkspaces(signal),
  })

  return (
    <section className="space-y-3">
      <h1 className="text-lg font-semibold">Workspaces</h1>

      {workspaces.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}

      {workspaces.isError &&
        (workspaces.error instanceof UnauthorizedError ? (
          <p className="text-sm text-muted-foreground">Signing in…</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-destructive">Could not load workspaces: {workspaces.error.message}</p>
            <Button variant="outline" onClick={() => workspaces.refetch()}>
              Try again
            </Button>
          </div>
        ))}

      {workspaces.isSuccess &&
        (workspaces.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {workspaces.data.map((workspace) => (
              <li key={workspace.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium">{workspace.name}</span>
                <span className="text-sm text-muted-foreground">
                  {workspace.defaultCurrency} · {statusLabel[workspace.status]}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}

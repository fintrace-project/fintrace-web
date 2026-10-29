import { Plus } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { LoadError } from '@/components/load-error'
import { Button } from '@/components/ui/button'
import { useWorkspaces } from '@/hooks/use-workspaces'

// `/` has no page of its own: it opens a workspace, or offers to create the first one.
export function StartPage() {
  const workspaces = useWorkspaces()

  if (workspaces.isPending) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (workspaces.isError) {
    return <LoadError what="workspaces" error={workspaces.error} onRetry={() => workspaces.refetch()} />
  }

  const first = workspaces.data.find((workspace) => workspace.status !== 'ARCHIVED') ?? workspaces.data[0]
  if (first) {
    return <Navigate to={`/w/${first.id}`} replace />
  }

  return (
    <section className="space-y-3">
      <h1 className="text-lg font-semibold">No workspaces yet</h1>
      <p className="text-sm text-muted-foreground">
        A workspace holds one set of accounts, categories and operations. Create one to start.
      </p>
      <Button asChild className="h-11 w-full md:h-8 md:w-auto">
        <Link to="/workspaces/new">
          <Plus aria-hidden />
          Create a workspace
        </Link>
      </Button>
    </section>
  )
}

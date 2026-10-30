import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import type { Workspace } from '@/core/api'
import { displayName, formatShortDate } from '@/core/format'
import { workspaceStatus } from '@/core/workspace-labels'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'
import { accentOf } from '@/lib/accent'

export function WorkspacesPage() {
  const workspaces = useWorkspaces()
  const [query, setQuery] = useState('')
  const user = useCurrentUser()

  const search = (
    <label className="flex min-h-11 items-center gap-2 rounded-[10px] border bg-card px-3.5 text-sm text-muted-foreground">
      <Search className="size-4" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find a workspace"
        aria-label="Find a workspace"
        className="w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground sm:w-44"
      />
    </label>
  )

  const create = (
    <Button asChild className="h-11 rounded-[10px] px-4.5 font-bold">
      <Link to="/workspaces/new">
        <Plus aria-hidden />
        New workspace
      </Link>
    </Button>
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Your workspaces"
        eyebrow={user.data && `Hello, ${user.data.firstName ?? displayName(user.data)}`}
        actions={
          <>
            {search}
            {create}
          </>
        }
      />

      {workspaces.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : workspaces.isError ? (
        <LoadError what="workspaces" error={workspaces.error} onRetry={() => workspaces.refetch()} />
      ) : (
        <WorkspaceGroups workspaces={workspaces.data} query={query} />
      )}
    </div>
  )
}

// Archived workspaces are kept for reference, so they sit apart, under the ones in use
function WorkspaceGroups({ workspaces, query }: { workspaces: Workspace[]; query: string }) {
  const found = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const inUse = found.filter((workspace) => workspace.status !== 'ARCHIVED')
  const archived = found.filter((workspace) => workspace.status === 'ARCHIVED')

  return (
    <>
      {workspaces.length === 0 && (
        <p className="max-w-xl text-sm text-muted-foreground">
          A workspace holds one set of accounts, categories and operations. Create one to start.
        </p>
      )}
      <section aria-label="Workspaces" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {inUse.map((workspace) => (
          <WorkspaceCard key={workspace.id} workspace={workspace} />
        ))}
        <Link
          to="/workspaces/new"
          className="flex min-h-44 flex-col items-center justify-center gap-2.5 rounded-[18px] border-[1.5px] border-dashed border-input text-muted-foreground hover:bg-card"
        >
          <Plus className="size-7" aria-hidden />
          <span className="text-[15px] font-bold text-foreground">Create workspace</span>
          <span className="text-[13px]">Start empty, or import your history</span>
        </Link>
      </section>

      {archived.length > 0 && (
        <section aria-labelledby="archived-heading" className="flex flex-col gap-4 border-t pt-6">
          <h2 id="archived-heading" className="text-base font-bold">
            Archived
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {archived.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link
      to={`/w/${workspace.id}`}
      style={accentOf(workspace.id)}
      className={cn(
        'flex flex-col gap-4.5 rounded-[18px] border bg-card p-5.5 transition-shadow hover:shadow-md',
        workspace.status === 'ARCHIVED' && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <WorkspaceAvatar workspace={workspace} className="size-11 text-lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[17px] font-bold">{workspace.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            Created {formatShortDate(workspace.createdAt)}
          </span>
        </span>
        <span className="rounded-lg bg-(--ws-soft) px-2 py-1 text-[11px] font-bold text-(--ws)">
          {workspaceStatus(workspace)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Currency</span>
        <span className="text-[26px] font-extrabold tracking-tight">{workspace.defaultCurrency}</span>
      </div>
    </Link>
  )
}

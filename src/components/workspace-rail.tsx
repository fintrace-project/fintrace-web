import { Plus } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

// Desktop only: a dock of workspaces down the left edge, "new" on top, the active one marked by a bar.
export function WorkspaceRail() {
  const workspaces = useWorkspaces()

  return (
    <nav
      aria-label="Workspaces"
      className="fixed inset-y-0 left-0 z-20 hidden w-16 flex-col items-center gap-2 border-r bg-background py-3 md:flex"
    >
      <Link
        to="/workspaces/new"
        aria-label="New workspace"
        title="New workspace"
        className="flex size-11 items-center justify-center rounded-xl border border-dashed text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-5" aria-hidden />
      </Link>

      <div className="h-px w-8 bg-border" />

      <ul className="flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto">
        {workspaces.data?.map((workspace) => (
          <li key={workspace.id}>
            <NavLink
              to={`/w/${workspace.id}`}
              aria-label={workspace.name}
              title={workspace.name}
              className={({ isActive }) =>
                cn(
                  'group relative flex px-2.5',
                  "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-foreground before:opacity-0 before:content-['']",
                  isActive && 'before:opacity-100',
                  workspace.status === 'ARCHIVED' && 'opacity-50',
                )
              }
            >
              {({ isActive }) => (
                <WorkspaceAvatar
                  name={workspace.name}
                  className={cn(
                    'group-hover:bg-accent',
                    isActive && 'bg-primary text-primary-foreground group-hover:bg-primary',
                  )}
                />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

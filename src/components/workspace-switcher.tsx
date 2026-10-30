import { Check, ChevronsUpDown, LayoutGrid, Plus } from 'lucide-react'
import { Link } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import type { Workspace } from '@/core/api'
import { workspaceSummary } from '@/core/workspace-labels'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

// Desktop: the current workspace at the top of the sidebar, opening the list of the others.
export function WorkspaceSwitcher({ current }: { current: Workspace | undefined }) {
  const workspaces = useWorkspaces()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-h-14 w-full items-center gap-3 rounded-xl border bg-card px-2.5 py-2 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50">
        {current ? (
          <WorkspaceAvatar workspace={current} className="size-9 rounded-[10px] text-base" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-muted">
            <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-bold">{current?.name ?? 'Workspaces'}</span>
          <span className="truncate text-xs text-muted-foreground">
            {current ? workspaceSummary(current) : 'Choose a workspace'}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="rounded-2xl p-2 shadow-[0_12px_32px_rgba(26,26,26,0.12)] ring-border">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          My workspaces
        </DropdownMenuLabel>
        {workspaces.data
          ?.filter((workspace) => workspace.status !== 'ARCHIVED')
          .map((workspace) => {
            const active = workspace.id === current?.id
            return (
              <DropdownMenuItem
                key={workspace.id}
                asChild
                className={cn('min-h-12 gap-2.5 rounded-[10px] px-2', active && 'bg-accent')}
              >
                <Link to={`/w/${workspace.id}`}>
                  <WorkspaceAvatar workspace={workspace} className="size-7 rounded-lg text-xs" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{workspace.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {workspaceSummary(workspace)}
                    </span>
                  </span>
                  {active && <Check className="size-4" strokeWidth={2.4} aria-label="Current" />}
                </Link>
              </DropdownMenuItem>
            )
          })}
        <DropdownMenuSeparator className="mx-0" />
        <DropdownMenuItem asChild className="min-h-11 gap-2.5 rounded-[10px] px-2 font-semibold">
          <Link to="/workspaces/new">
            <Plus aria-hidden />
            Create workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11 gap-2.5 rounded-[10px] px-2 font-semibold">
          <Link to="/workspaces">
            <LayoutGrid aria-hidden />
            All workspaces
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

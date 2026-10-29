import { ChevronsUpDown, Plus } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import type { Workspace } from '@/core/api'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

// Phone only: the rail's list, opened from the current workspace's name in the header.
export function WorkspaceSheet({ current }: { current: Workspace | undefined }) {
  const workspaces = useWorkspaces()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="-ml-2 h-11 min-w-0 px-2 text-base font-semibold md:hidden">
          <span className="truncate">{current?.name ?? 'Workspaces'}</span>
          <ChevronsUpDown className="text-muted-foreground" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0">
        <SheetHeader>
          <SheetTitle>Workspaces</SheetTitle>
        </SheetHeader>
        <nav aria-label="Workspaces" className="flex flex-col gap-1 overflow-y-auto px-2 pb-4">
          <SheetClose asChild>
            <Link
              to="/workspaces/new"
              className="flex items-center gap-3 rounded-lg p-1.5 text-muted-foreground"
            >
              <span className="flex size-11 items-center justify-center rounded-xl border border-dashed">
                <Plus className="size-5" aria-hidden />
              </span>
              New workspace
            </Link>
          </SheetClose>
          {workspaces.data?.map((workspace) => (
            <SheetClose key={workspace.id} asChild>
              <NavLink
                to={`/w/${workspace.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg p-1.5',
                    isActive && 'bg-muted font-medium',
                    workspace.status === 'ARCHIVED' && 'opacity-50',
                  )
                }
              >
                <WorkspaceAvatar name={workspace.name} />
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                <span className="text-xs text-muted-foreground">{workspace.defaultCurrency}</span>
              </NavLink>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

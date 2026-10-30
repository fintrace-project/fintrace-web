import { Check, ChevronDown, LayoutGrid, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import type { Workspace } from '@/core/api'
import { workspaceSummary } from '@/core/workspace-labels'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'
import { accentOf } from '@/lib/accent'

// Phone: the current workspace as a pill at the top, the list in a sheet rising from the bottom.
export function WorkspaceSheet({ current }: { current: Workspace | undefined }) {
  const workspaces = useWorkspaces()

  return (
    <Sheet>
      <SheetTrigger className="flex min-h-11 min-w-0 items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {current ? (
          <WorkspaceAvatar workspace={current} className="size-8 rounded-full" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted">
            <LayoutGrid className="size-4 text-muted-foreground" aria-hidden />
          </span>
        )}
        <span className="truncate text-[15px] font-bold">{current?.name ?? 'Workspaces'}</span>
        <ChevronDown className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
      </SheetTrigger>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Portalled out of the shell, so the accent is not inherited
        style={current && accentOf(current.id)}
        className="max-h-[85dvh] gap-1.5 rounded-t-3xl border-0 px-4 pt-2.5 pb-[max(2rem,env(safe-area-inset-bottom))]"
      >
        <div aria-hidden className="mb-2.5 h-1.5 w-10 self-center rounded-full bg-input" />
        <SheetHeader className="flex-row items-center justify-between p-0 px-1 pb-2">
          <SheetTitle className="text-xl font-extrabold">Workspaces</SheetTitle>
          <SheetClose className="flex min-h-11 items-center text-sm font-semibold text-muted-foreground">
            Close
          </SheetClose>
        </SheetHeader>

        <nav aria-label="Workspaces" className="flex flex-col gap-1.5 overflow-y-auto">
          {workspaces.data?.map((workspace) => {
            const active = workspace.id === current?.id
            return (
              <SheetClose key={workspace.id} asChild>
                <Link
                  to={`/w/${workspace.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-16 items-center gap-3 rounded-2xl px-2.5 py-2',
                    active && 'bg-(--ws-soft)',
                    workspace.status === 'ARCHIVED' && 'opacity-60',
                  )}
                >
                  <WorkspaceAvatar workspace={workspace} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-bold">{workspace.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {workspaceSummary(workspace)}
                    </span>
                  </span>
                  {active && <Check className="size-5 text-(--ws)" strokeWidth={2.4} aria-label="Current" />}
                </Link>
              </SheetClose>
            )
          })}
        </nav>

        <div className="my-2 h-px bg-border" />
        <SheetClose asChild>
          <Button asChild className="h-13 rounded-2xl text-[15px] font-bold">
            <Link to="/workspaces/new">
              <Plus aria-hidden />
              Create workspace
            </Link>
          </Button>
        </SheetClose>
        <SheetClose asChild>
          <Button asChild variant="ghost" className="h-12 font-semibold text-muted-foreground">
            <Link to="/workspaces">Manage workspaces</Link>
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  )
}

import { LogOut, Settings } from 'lucide-react'
import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { WorkspaceSheet } from '@/components/workspace-sheet'
import { workspaceSections, workspaceSettings } from '@/components/workspace-sections'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'
import { workspaceAccent } from '@/lib/workspace-accent'

const roundButton = 'flex size-11 items-center justify-center rounded-full border bg-card'

// Mobile-first (§3.6): a workspace pill, a sheet and a bottom tab bar on phones; a sidebar from `md` up.
export function AppShell() {
  const workspaceId = useMatch('/w/:workspaceId/*')?.params.workspaceId
  const current = useWorkspace(workspaceId)
  const sections = workspaceId ? workspaceSections(workspaceId) : []

  return (
    <div
      style={current && workspaceAccent(current.id)}
      className={cn('min-h-dvh md:flex md:pb-0', sections.length > 0 && 'pb-20')}
    >
      <AppSidebar current={current} sections={sections} />

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 px-4 pt-5 md:hidden">
          <WorkspaceSheet current={current} />
          <div className="flex gap-2">
            {current && (
              <Link
                to={workspaceSettings(current.id)}
                aria-label="Workspace settings"
                className={roundButton}
              >
                <Settings className="size-[18px]" aria-hidden />
              </Link>
            )}
            <form method="post" action="/auth/logout">
              <button type="submit" aria-label="Log out" className={roundButton}>
                <LogOut className="size-[18px]" aria-hidden />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:pt-7 md:pb-12">
          <Outlet />
        </main>
      </div>

      {sections.length > 0 && (
        <nav
          aria-label="Workspace sections"
          className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
        >
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex min-h-13 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground',
                  isActive && 'font-bold text-(--ws)',
                )
              }
            >
              <section.icon className="size-[22px]" aria-hidden />
              {section.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

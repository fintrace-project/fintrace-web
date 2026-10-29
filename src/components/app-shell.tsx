import { LayoutDashboard, List, LogOut, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useMatch } from 'react-router'
import { Button } from '@/components/ui/button'
import { WorkspaceRail } from '@/components/workspace-rail'
import { WorkspaceSheet } from '@/components/workspace-sheet'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
}

const workspaceTabs = (workspaceId: string): Tab[] => [
  { to: `/w/${workspaceId}`, label: 'Overview', icon: LayoutDashboard },
  { to: `/w/${workspaceId}/operations`, label: 'Operations', icon: List },
]

// Mobile-first (§3.6): workspaces in a sheet and a bottom tab bar on phones; a left rail and header tabs from `md` up.
export function AppShell() {
  const workspaceId = useMatch('/w/:workspaceId/*')?.params.workspaceId
  const current = useWorkspace(workspaceId)
  const tabs = workspaceId ? workspaceTabs(workspaceId) : []

  return (
    <div className={cn('min-h-dvh md:pb-0 md:pl-16', tabs.length > 0 && 'pb-20')}>
      <WorkspaceRail />

      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <WorkspaceSheet current={current} />
          <span className="hidden min-w-0 items-baseline gap-2 md:flex">
            <span className="truncate font-semibold tracking-tight">{current?.name ?? 'fintrace'}</span>
            {current && <span className="text-sm text-muted-foreground">{current.defaultCurrency}</span>}
          </span>
          <nav className="hidden gap-1 md:flex">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted',
                    isActive && 'bg-muted font-medium text-foreground',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <form method="post" action="/auth/logout" className="ml-auto">
            <Button type="submit" variant="ghost" className="h-11 md:h-8">
              <LogOut aria-hidden />
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>

      {tabs.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 grid grid-cols-2 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground',
                  isActive && 'text-foreground',
                )
              }
            >
              <tab.icon className="size-5" aria-hidden />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

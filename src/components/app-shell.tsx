import { LayoutDashboard, List, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/operations', label: 'Operations', icon: List },
]

// Mobile-first (§3.6): a bottom tab bar on phones, header navigation from `md` up.
export function AppShell() {
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <span className="font-semibold tracking-tight">fintrace</span>
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
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>

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
    </div>
  )
}

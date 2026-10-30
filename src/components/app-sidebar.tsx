import { Settings } from 'lucide-react'
import { NavLink } from 'react-router'
import { UserCard } from '@/components/user-menu'
import { WorkspaceSwitcher } from '@/components/workspace-switcher'
import { workspaceSettings, type Section } from '@/components/workspace-sections'
import type { Workspace } from '@/core/api'
import { cn } from '@/lib/utils'

const navItem =
  'flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-sm text-muted-foreground hover:bg-accent'

// Desktop only: the workspace switcher, the current workspace's sections, its settings and who is signed in at the foot.
export function AppSidebar({ current, sections }: { current: Workspace | undefined; sections: Section[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 border-r bg-sidebar px-3 py-4 md:flex">
      <WorkspaceSwitcher current={current} />

      {sections.length > 0 && (
        <nav aria-label="Workspace sections" className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end
              className={({ isActive }) =>
                cn(
                  navItem,
                  'font-medium',
                  isActive && 'bg-(--ws-soft) font-bold text-foreground hover:bg-(--ws-soft)',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn('size-1.5 rounded-full bg-input', isActive && 'bg-(--ws)')}
                  />
                  {section.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="mt-auto flex flex-col gap-0.5 border-t pt-3">
        {current && (
          <NavLink
            to={workspaceSettings(current.id)}
            className={({ isActive }) =>
              cn(navItem, isActive && 'bg-(--ws-soft) font-bold text-foreground hover:bg-(--ws-soft)')
            }
          >
            <Settings className="size-4" aria-hidden />
            Workspace settings
          </NavLink>
        )}
        <UserCard />
      </div>
    </aside>
  )
}

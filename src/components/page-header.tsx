import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { useWorkspace } from '@/hooks/use-workspaces'

// A page's title; inside a workspace, its accent bar and a "Workspace / Page" trail above it, else `eyebrow`.
export function PageHeader({
  title,
  eyebrow,
  actions,
}: {
  title: string
  eyebrow?: ReactNode
  actions?: ReactNode
}) {
  const current = useWorkspace(useParams().workspaceId)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {current && <div aria-hidden className="hidden h-1 w-16 rounded-full bg-(--ws) md:block" />}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {current ? (
            <span className="truncate text-[13px] text-muted-foreground">
              {current.name} <span className="text-ring">/</span> {title}
            </span>
          ) : (
            eyebrow && <span className="truncate text-sm text-muted-foreground">{eyebrow}</span>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight md:text-[32px]">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
    </div>
  )
}

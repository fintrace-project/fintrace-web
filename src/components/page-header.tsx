import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

// A page's title; inside a workspace, its accent bar above it, else `eyebrow`.
// `controls` are for use wherever the reader has scrolled to: the header then stays up at every width,
// with them under the title. Without them it stays up on a phone only.
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  controls,
}: {
  title: string
  eyebrow?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  controls?: ReactNode
}) {
  const current = useWorkspace(useParams().workspaceId)

  return (
    // On a phone it sits under the shell's top bar, 68 px tall, with the list scrolling beneath it
    <div
      className={cn(
        'sticky top-[68px] z-10 -mx-4 flex flex-col gap-4 bg-background px-4 pb-2',
        controls
          ? 'md:top-0 md:-mx-8 md:px-8 md:py-3'
          : 'md:static md:mx-0 md:gap-6 md:bg-transparent md:px-0 md:pb-0',
        current && 'bg-(--ws-soft)',
      )}
    >
      {current && !controls && (
        <div aria-hidden className="hidden h-1 w-16 rounded-full bg-(--ws) md:block" />
      )}
      <header className={cn('flex justify-between gap-4', controls ? 'items-center' : 'flex-wrap items-end')}>
        <div className="flex min-w-0 flex-col gap-1.5">
          {!current && eyebrow && <span className="truncate text-sm text-muted-foreground">{eyebrow}</span>}
          <h1 className={cn('text-2xl font-extrabold tracking-tight md:text-[32px]', controls && 'truncate')}>
            {title}
          </h1>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {controls}
    </div>
  )
}

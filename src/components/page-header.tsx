import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

// The first page of a visit keeps the browser's own starting focus
let entered = false

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
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const heading = useRef<HTMLHeadingElement>(null)

  // Says the page changed to a screen reader, unless the page has put focus somewhere itself (an autofocused field)
  useEffect(() => {
    if (!entered) {
      entered = true
      return
    }
    if (!heading.current?.closest('main')?.contains(document.activeElement)) {
      heading.current?.focus({ preventScroll: true })
    }
  }, [pathname])

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
          <title>{t('app.pageTitle', { page: title })}</title>
          <h1
            ref={heading}
            tabIndex={-1}
            className={cn(
              'text-2xl font-extrabold tracking-tight outline-none md:text-[32px]',
              controls && 'truncate',
            )}
          >
            {title}
          </h1>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
        </div>
        {actions && <div className="flex flex-wrap justify-end gap-2 max-sm:grow">{actions}</div>}
      </header>
      {controls}
    </div>
  )
}

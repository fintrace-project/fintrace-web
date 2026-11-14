import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BalanceWidget } from '@/components/balance-widget'
import type { Workspace } from '@/core/api'
import { initials } from '@/core/format'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-5', className)}>
      <div className="flex min-h-9 items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Pending({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

const TILE =
  'flex items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-2 sm:p-5'

function PendingTile({ label }: { label: string }) {
  const { t } = useTranslation()
  return (
    <div className={TILE}>
      <span className="text-caption text-muted-foreground">{label}</span>
      <span
        aria-hidden
        className="text-2xl font-extrabold tracking-tight text-muted-foreground/50 max-sm:hidden"
      >
        —
      </span>
      <span className="text-xs text-muted-foreground">{t('common.comingSoon')}</span>
    </div>
  )
}

// The workspace's headline figures; income and expenses wait for the cashflow endpoint (3.6). The balance widget
// is the tall one, so the small tiles keep their own height rather than stretch beside it.
export function TotalsTiles({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={t('totals.label')}
      className="grid items-start gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr]"
    >
      <BalanceWidget workspace={workspace} className="sm:col-span-2 lg:col-span-1" />
      <PendingTile label={t('totals.income')} />
      <PendingTile label={t('totals.expenses')} />
    </section>
  )
}

// An account's or a category's own colour, picked by its id; the workspace's accent stays with the page around it
export function InitialsAvatar({
  name,
  colorId,
  className,
}: {
  name: string
  colorId: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={accentOf(colorId)}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-control bg-(--ws-soft) text-caption font-extrabold text-(--ws)',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

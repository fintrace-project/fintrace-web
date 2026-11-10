import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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

function PendingTile({ label }: { label: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-2 sm:p-5">
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

// The workspace's headline figures; each waits for the Core task that computes it
export function TotalsTiles() {
  const { t } = useTranslation()
  return (
    <section aria-label={t('totals.label')} className="grid gap-2 sm:grid-cols-3 sm:gap-4">
      <PendingTile label={t('totals.balance')} />
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

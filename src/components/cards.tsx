import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { initials } from '@/core/format'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
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

function PendingTile({ label, task }: { label: string; task: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span aria-hidden className="text-[28px] font-extrabold tracking-tight text-muted-foreground/50">
        —
      </span>
      <span className="text-xs text-muted-foreground">{t('common.arrivesWith', { task })}</span>
    </div>
  )
}

// The workspace's headline figures; each waits for the Core task that computes it
export function TotalsTiles() {
  const { t } = useTranslation()
  return (
    <section aria-label={t('totals.label')} className="grid gap-4 sm:grid-cols-3">
      <PendingTile label={t('totals.balance')} task="4.13" />
      <PendingTile label={t('totals.income')} task="4.10" />
      <PendingTile label={t('totals.expenses')} task="4.10" />
    </section>
  )
}

export function AccountAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-(--ws-soft) text-[13px] font-extrabold text-(--ws)',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

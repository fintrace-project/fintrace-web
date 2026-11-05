import { ArrowDown, ArrowUp, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useDifferenceArrows } from '@/hooks/use-feed'

const arrow = 'size-11 rounded-full border-warning-border bg-card md:size-9'

function Arrow({ to, label, icon: Icon }: { to: string | undefined; label: string; icon: LucideIcon }) {
  if (!to) {
    return (
      <Button variant="outline" size="icon" className={arrow} disabled aria-label={label}>
        <Icon aria-hidden />
      </Button>
    )
  }
  return (
    <Button asChild variant="outline" size="icon" className={arrow}>
      <Link to={{ search: `?at=${to}` }} aria-label={label}>
        <Icon aria-hidden />
      </Link>
    </Button>
  )
}

// Counted from the difference last jumped to, or from the head of the feed; absent on an account with
// none. In the pinned header: a jump lands deep in the list, and scrolling back to a control at the top
// of the page would load other pages on the way.
export function DifferenceArrows({
  workspaceId,
  accountId,
  at,
}: {
  workspaceId: string
  accountId: string
  at: string | undefined
}) {
  const { older, newer } = useDifferenceArrows(workspaceId, accountId, at)
  const { t } = useTranslation()

  if (!at && !older) {
    return null
  }
  return (
    <div
      role="group"
      aria-label={t('feed.differences')}
      className="flex items-center gap-2 rounded-2xl border border-warning-border bg-warning-soft py-1.5 pr-1.5 pl-3.5 text-warning-foreground"
    >
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 text-sm font-bold">{t('feed.differences')}</span>
      <Arrow to={newer} label={t('feed.newerDifference')} icon={ArrowUp} />
      <Arrow to={older} label={t('feed.olderDifference')} icon={ArrowDown} />
    </div>
  )
}

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { Feed } from '@/components/feed'
import { AddOperationButton } from '@/components/operation-dialog'
import { PageHeader } from '@/components/page-header'
import { formatFeedDay } from '@/core/format'
import { useResetFeed, useWorkspaceFeed } from '@/hooks/use-feed'
import { useWorkspace } from '@/hooks/use-workspaces'

const DAY = /^\d{4}-\d{2}-\d{2}$/

export function OperationsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  // `?day=YYYY-MM-DD` narrows the feed to that day, as the heatmap's "Open in feed" asks; anything else is ignored
  const [search, setSearch] = useSearchParams()
  const asked = search.get('day')
  const day = asked && DAY.test(asked) ? asked : undefined
  const feed = useWorkspaceFeed(workspaceId, day)
  const toHead = useResetFeed(workspaceId, undefined, day)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.operations')} actions={<AddOperationButton workspace={workspace} />} />
      {day && (
        <div className="flex items-center gap-1 self-start rounded-full border bg-card py-0.5 pr-1 pl-3 text-sm font-semibold">
          {t('feed.onDay', { date: formatFeedDay(day) })}
          <button
            type="button"
            aria-label={t('feed.allDays')}
            onClick={() => setSearch({})}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      <Feed workspaceId={workspaceId} feed={feed} toHead={toHead} />
    </div>
  )
}

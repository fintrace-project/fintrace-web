import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Feed } from '@/components/feed'
import { PageHeader } from '@/components/page-header'
import { useResetFeed, useWorkspaceFeed } from '@/hooks/use-feed'

export function OperationsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const feed = useWorkspaceFeed(workspaceId)
  const toHead = useResetFeed(workspaceId)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.operations')} />
      <Feed workspaceId={workspaceId} feed={feed} toHead={toHead} />
    </div>
  )
}

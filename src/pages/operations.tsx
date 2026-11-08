import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Feed } from '@/components/feed'
import { AddOperationButton } from '@/components/operation-dialog'
import { PageHeader } from '@/components/page-header'
import { useResetFeed, useWorkspaceFeed } from '@/hooks/use-feed'
import { useWorkspace } from '@/hooks/use-workspaces'

export function OperationsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  const feed = useWorkspaceFeed(workspaceId)
  const toHead = useResetFeed(workspaceId)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.operations')} actions={<AddOperationButton workspace={workspace} />} />
      <Feed workspaceId={workspaceId} feed={feed} toHead={toHead} />
    </div>
  )
}

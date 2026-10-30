import { useTranslation } from 'react-i18next'
import { Outlet, useMatch, useParams } from 'react-router'
import { ArchivedBanner } from '@/components/archive-controls'
import { LoadError } from '@/components/load-error'
import { NewWorkspaceBanner } from '@/components/new-workspace-banner'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { NotFoundPage } from '@/pages/not-found'

// The route for one workspace: its pages render only once the id in the URL is known to be the caller's.
export function WorkspaceLayout() {
  const { workspaceId } = useParams()
  const workspaces = useWorkspaces()
  const { t } = useTranslation()
  const importing = useMatch('/w/:workspaceId/import') !== null

  if (workspaces.isPending) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }
  if (workspaces.isError) {
    return (
      <LoadError
        title={t('errors.loadWorkspaces')}
        error={workspaces.error}
        onRetry={() => workspaces.refetch()}
      />
    )
  }
  const workspace = workspaces.data.find((each) => each.id === workspaceId)
  if (!workspace) {
    return <NotFoundPage />
  }
  return (
    <div className="flex flex-col gap-5">
      {workspace.status === 'ARCHIVED' && <ArchivedBanner workspace={workspace} />}
      {workspace.status === 'NEW' && !importing && <NewWorkspaceBanner workspace={workspace} />}
      <Outlet />
    </div>
  )
}

import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { WorkspaceAvatar } from '@/components/workspace-avatar'
import type { Workspace } from '@/core/api'
import { displayName, formatShortDate } from '@/core/format'
import { workspaceStatus } from '@/core/workspace-labels'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'
import { accentOf } from '@/lib/accent'

export function WorkspacesPage() {
  const workspaces = useWorkspaces()
  const [query, setQuery] = useState('')
  const user = useCurrentUser()
  const { t } = useTranslation()

  const search = (
    <label className="flex min-h-11 min-w-40 flex-1 items-center gap-2 rounded-control border bg-card px-3.5 text-sm text-muted-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:flex-none">
      <Search className="size-4" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('workspaces.find')}
        aria-label={t('workspaces.find')}
        className="w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground sm:w-44"
      />
    </label>
  )

  const create = (
    <Button asChild className="size-11 rounded-control px-0 font-bold sm:w-auto sm:px-4.5">
      <Link to="/workspaces/new">
        <Plus aria-hidden />
        <span className="max-sm:sr-only">{t('workspaces.new')}</span>
      </Link>
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('workspaces.title')}
        eyebrow={user.data && t('workspaces.hello', { name: user.data.firstName ?? displayName(user.data) })}
        actions={
          <>
            {search}
            {create}
          </>
        }
      />

      {workspaces.isPending ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : workspaces.isError ? (
        <LoadError
          title={t('errors.loadWorkspaces')}
          error={workspaces.error}
          onRetry={() => workspaces.refetch()}
        />
      ) : (
        <WorkspaceGroups workspaces={workspaces.data} query={query} />
      )}
    </div>
  )
}

// Archived workspaces are kept for reference, so they sit apart, under the ones in use
function WorkspaceGroups({ workspaces, query }: { workspaces: Workspace[]; query: string }) {
  const found = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const inUse = found.filter((workspace) => workspace.status !== 'ARCHIVED')
  const archived = found.filter((workspace) => workspace.status === 'ARCHIVED')
  const { t } = useTranslation()

  return (
    <>
      {workspaces.length === 0 && (
        <p className="max-w-xl text-sm text-muted-foreground">{t('workspaces.intro')}</p>
      )}
      <section
        aria-label={t('shell.workspaces')}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
      >
        {inUse.map((workspace) => (
          <WorkspaceCard key={workspace.id} workspace={workspace} />
        ))}
        <Link
          to="/workspaces/new"
          className="flex min-h-44 flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-card"
        >
          <Plus className="size-7" aria-hidden />
          <span className="text-row font-bold text-foreground">{t('shell.createWorkspace')}</span>
          <span className="text-caption">{t('workspaces.createHint')}</span>
        </Link>
      </section>

      {archived.length > 0 && (
        <section aria-labelledby="archived-heading" className="flex flex-col gap-4 border-t pt-6">
          <h2 id="archived-heading" className="text-base font-bold">
            {t('workspaces.archived')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {archived.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/w/${workspace.id}`}
      style={accentOf(workspace.id)}
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md',
        workspace.status === 'ARCHIVED' && 'bg-card/50',
      )}
    >
      <div className="flex items-center gap-3">
        <WorkspaceAvatar workspace={workspace} className="size-11 text-lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-bold">{workspace.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {t('workspaces.created', { date: formatShortDate(workspace.createdAt) })}
          </span>
        </span>
        <span className="rounded-lg bg-(--ws-soft) px-2 py-1 text-[11px] font-bold text-(--ws)">
          {workspaceStatus(workspace)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{t('workspaces.currency')}</span>
        <span className="text-2xl font-extrabold tracking-tight">{workspace.defaultCurrency}</span>
      </div>
    </Link>
  )
}

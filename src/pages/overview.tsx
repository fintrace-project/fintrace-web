import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ArchiveButton } from '@/components/archive-controls'
import { InitialsAvatar, Panel, Pending, TotalsTiles } from '@/components/cards'
import { Feed } from '@/components/feed'
import { LoadError } from '@/components/load-error'
import { AddOperationButton } from '@/components/operation-dialog'
import { PageHeader } from '@/components/page-header'
import { formatBalance } from '@/core/format'
import { useAccountRows } from '@/hooks/use-accounts'
import { useResetFeed, useWorkspaceFeed } from '@/hooks/use-feed'
import { useMediaQuery, WIDE } from '@/hooks/use-media-query'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

export function OverviewPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  // On a phone the feed is the Operations tab's; rendered rather than hidden, so it is not fetched there
  const wide = useMediaQuery(WIDE)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('sections.overview')}
        actions={
          <>
            {/* On a phone it stays in the workspace's settings, leaving the title's row to the main action */}
            <div className="max-sm:hidden">
              <ArchiveButton workspace={workspace} />
            </div>
            <AddOperationButton workspace={workspace} />
          </>
        }
      />
      <TotalsTiles />

      {/* Between md and lg the side column comes first: below a feed that keeps loading it could never be reached */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <aside
          aria-label={t('overview.summary')}
          className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1"
        >
          <Panel title={t('overview.whereMoneyWent')} className="md:max-lg:hidden">
            <Pending>{t('overview.breakdownPending')}</Pending>
            {/* Below the list as in the prototype: beside the title it squeezes both onto two lines */}
            <MoreLink to={`/w/${workspaceId}/statistics`} className="self-start">
              {t('overview.allStatistics')}
            </MoreLink>
          </Panel>
          <Panel title={t('overview.expensesByMonth')} className="md:max-lg:hidden">
            <Pending>{t('overview.chartPending')}</Pending>
          </Panel>
          <AccountsPanel workspaceId={workspaceId} />
        </aside>

        {wide && <Operations workspaceId={workspaceId} />}
      </div>
    </div>
  )
}

function Operations({ workspaceId }: { workspaceId: string }) {
  const feed = useWorkspaceFeed(workspaceId)
  const toHead = useResetFeed(workspaceId)
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="overview-operations"
      className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-start-1"
    >
      <h2 id="overview-operations" className="text-[22px] font-extrabold tracking-tight">
        {t('sections.operations')}
      </h2>
      <Feed workspaceId={workspaceId} feed={feed} toHead={toHead} />
    </section>
  )
}

function MoreLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn('flex min-h-11 items-center px-1 text-caption font-bold', className)}>
      {children}
    </Link>
  )
}

function AccountsPanel({ workspaceId }: { workspaceId: string }) {
  const { isPending, error, retry, rows } = useAccountRows(workspaceId)
  const { t } = useTranslation()

  return (
    <Panel
      title={t('sections.accounts')}
      action={<MoreLink to={`/w/${workspaceId}/accounts`}>{t('overview.allAccounts')}</MoreLink>}
    >
      {error ? (
        <LoadError title={t('errors.loadAccounts')} error={error} onRetry={retry} />
      ) : isPending || !rows ? (
        <Pending>{t('common.loading')}</Pending>
      ) : rows.length === 0 ? (
        <Pending>{t('accounts.empty')}</Pending>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {rows.map(({ account, balance }) => (
            <li key={account.id}>
              <Link
                to={`/w/${workspaceId}/accounts/${account.id}`}
                className="flex min-h-12 items-center gap-2.5 rounded-control px-2"
              >
                <InitialsAvatar name={account.name} colorId={account.id} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{account.name}</span>
                <span className="text-sm font-bold whitespace-nowrap">{formatBalance(balance)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

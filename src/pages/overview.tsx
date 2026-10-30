import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ArchiveButton } from '@/components/archive-controls'
import { AccountAvatar, Panel, Pending, TotalsTiles } from '@/components/cards'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { formatBalance } from '@/core/format'
import { useAccountRows } from '@/hooks/use-accounts'
import { useWorkspace } from '@/hooks/use-workspaces'

export function OverviewPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.overview')} actions={<ArchiveButton workspace={workspace} />} />
      <TotalsTiles />

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('overview.expensesByMonth')}>
          <Pending>{t('overview.chartPending')}</Pending>
        </Panel>
        <AccountsPanel workspaceId={workspaceId} />
      </section>

      <Panel title={t('overview.recentOperations')}>
        <Pending>{t('overview.feedPending')}</Pending>
      </Panel>
    </div>
  )
}

function AccountsPanel({ workspaceId }: { workspaceId: string }) {
  const { isPending, error, retry, rows } = useAccountRows(workspaceId)
  const { t } = useTranslation()

  const action = (
    <Link
      to={`/w/${workspaceId}/accounts`}
      className="flex min-h-11 items-center px-1 text-[13px] font-semibold text-muted-foreground"
    >
      {t('overview.allAccounts')}
    </Link>
  )

  return (
    <Panel title={t('sections.accounts')} action={action}>
      {error ? (
        <LoadError title={t('errors.loadAccounts')} error={error} onRetry={retry} />
      ) : isPending || !rows ? (
        <Pending>{t('common.loading')}</Pending>
      ) : rows.length === 0 ? (
        <Pending>{t('accounts.empty')}</Pending>
      ) : (
        <ul className="flex flex-col">
          {rows.map(({ account, balance }) => (
            <li key={account.id} className="flex items-center gap-3 border-t py-2.5">
              <AccountAvatar name={account.name} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{account.name}</span>
                <span className="text-xs text-muted-foreground">{account.currency}</span>
              </span>
              <span className="text-[15px] font-bold whitespace-nowrap">{formatBalance(balance)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

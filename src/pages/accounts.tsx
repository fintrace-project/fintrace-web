import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { AccountAvatar, Pending, TotalsTiles } from '@/components/cards'
import { CreateAccountDialog } from '@/components/create-account-dialog'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { formatBalance } from '@/core/format'
import { useAccountRows, type AccountRow } from '@/hooks/use-accounts'
import { useWorkspace } from '@/hooks/use-workspaces'

export function AccountsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  // Core refuses every write to an archived workspace, and one mid-import
  const writable = workspace.status === 'NEW' || workspace.status === 'ACTIVE'
  const { isPending, error, retry, rows } = useAccountRows(workspaceId)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.accounts')} />
      <TotalsTiles />

      {error ? (
        <LoadError title={t('errors.loadAccounts')} error={error} onRetry={retry} />
      ) : isPending || !rows ? (
        <Pending>{t('common.loading')}</Pending>
      ) : (
        <>
          {rows.length === 0 && <Pending>{t('accounts.empty')}</Pending>}
          <section aria-label={t('sections.accounts')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <AccountCard key={row.account.id} row={row} />
            ))}
            {writable && <CreateAccountDialog workspace={workspace} />}
          </section>
        </>
      )}
    </div>
  )
}

function AccountCard({ row: { account, balance } }: { row: AccountRow }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border bg-card p-5">
      <AccountAvatar name={account.name} className="size-10 rounded-xl text-sm" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold">{account.name}</span>
        <span className="text-xs text-muted-foreground">{account.currency}</span>
      </span>
      <span className="text-2xl font-extrabold tracking-tight">{formatBalance(balance)}</span>
    </div>
  )
}

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { AccountMenu, RestoreButton } from '@/components/account-actions'
import { InitialsAvatar, Pending } from '@/components/cards'
import { CreateAccountDialog } from '@/components/create-account-dialog'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { formatBalance } from '@/core/format'
import { cn } from '@/lib/utils'
import { useAccountRows, type AccountRow } from '@/hooks/use-accounts'
import { useWorkspace } from '@/hooks/use-workspaces'

export function AccountsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  // Core refuses every write to an archived workspace, and one mid-import
  const writable = workspace.status === 'NEW' || workspace.status === 'ACTIVE'
  const { isPending, error, retry, rows, archived } = useAccountRows(workspaceId)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.accounts')} />

      {error ? (
        <LoadError title={t('errors.loadAccounts')} error={error} onRetry={retry} />
      ) : isPending || !rows || !archived ? (
        <Pending>{t('common.loading')}</Pending>
      ) : (
        <>
          {rows.length === 0 && <Pending>{t('accounts.empty')}</Pending>}
          <section aria-label={t('sections.accounts')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <AccountCard key={row.account.id} row={row}>
                {writable && <AccountMenu account={row.account} />}
              </AccountCard>
            ))}
            {writable && <CreateAccountDialog workspace={workspace} />}
          </section>
          {archived.length > 0 && (
            <section aria-labelledby="archived-accounts" className="flex flex-col gap-3">
              <h2 id="archived-accounts" className="text-base font-bold">
                {t('accounts.archived.title')}
              </h2>
              <Pending>{t('accounts.archived.text')}</Pending>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((row) => (
                  <AccountCard key={row.account.id} row={row} muted>
                    {writable && <RestoreButton account={row.account} />}
                  </AccountCard>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

// The children are the card's controls, absent where the workspace takes no writes
function AccountCard({
  row: { account, balance },
  muted = false,
  children,
}: {
  row: AccountRow
  muted?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={cn('relative flex flex-col gap-3.5 rounded-2xl border bg-card p-5', muted && 'bg-card/50')}
    >
      <div className="flex items-start justify-between gap-2">
        <InitialsAvatar
          name={account.name}
          colorId={account.id}
          className={cn('size-10 rounded-xl text-sm', muted && 'grayscale')}
        />
        {!muted && <div className="relative z-10">{children}</div>}
      </div>
      <span className="flex min-w-0 flex-col gap-0.5">
        {/* The link's area stretches over the card; the card's controls sit above it */}
        <Link
          to={`/w/${account.workspaceId}/accounts/${account.id}`}
          className="truncate text-[15px] font-bold after:absolute after:inset-0 after:rounded-2xl"
        >
          {account.name}
        </Link>
        <span className="text-xs text-muted-foreground">{account.currency}</span>
      </span>
      <span className={cn('text-2xl font-extrabold tracking-tight', muted && 'text-muted-foreground')}>
        {formatBalance(balance)}
      </span>
      {muted && <div className="relative z-10">{children}</div>}
    </div>
  )
}

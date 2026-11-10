import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { Pending } from '@/components/cards'
import { AnchorArrows } from '@/components/anchor-arrows'
import { Feed } from '@/components/feed'
import { LoadError } from '@/components/load-error'
import { AddOperationButton } from '@/components/operation-dialog'
import { PageHeader } from '@/components/page-header'
import { RecordBalanceButton } from '@/components/record-balance-dialog'
import type { Account } from '@/core/api'
import { formatBalance } from '@/core/format'
import { useAccountBalances, useAccounts } from '@/hooks/use-accounts'
import { useAccountFeed, useResetFeed } from '@/hooks/use-feed'
import { useWorkspace } from '@/hooks/use-workspaces'
import { NotFoundPage } from '@/pages/not-found'

export function AccountPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const { accountId } = useParams()
  const workspace = useWorkspace(workspaceId)!
  const accounts = useAccounts(workspaceId)
  const balances = useAccountBalances(workspaceId)
  const [searchParams] = useSearchParams()
  // In the URL, so a jump is one step of Back and survives a reload
  const at = searchParams.get('at') ?? undefined
  const { t } = useTranslation()

  if (accounts.error && !accounts.data) {
    return (
      <LoadError title={t('errors.loadAccounts')} error={accounts.error} onRetry={() => accounts.refetch()} />
    )
  }
  if (!accounts.data) {
    return <Pending>{t('common.loading')}</Pending>
  }
  const account = accounts.data.find((each) => each.id === accountId)
  if (!account) {
    return <NotFoundPage />
  }

  const balance = balances.data?.find((each) => each.accountId === account.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={account.name}
        subtitle={
          balance && (
            <span className="block truncate">{t('feed.balance', { amount: formatBalance(balance) })}</span>
          )
        }
        actions={
          !account.archived && (
            <>
              <RecordBalanceButton workspace={workspace} account={account} balance={balance} />
              <AddOperationButton workspace={workspace} accountId={account.id} />
            </>
          )
        }
        controls={<AnchorArrows workspaceId={workspaceId} accountId={account.id} at={at} />}
      />
      <AccountFeed account={account} at={at} />
    </div>
  )
}

// Apart from the page so the feed is asked for only once the account is known to exist
function AccountFeed({ account, at }: { account: Account; at: string | undefined }) {
  const feed = useAccountFeed(account.workspaceId, account.id, at)
  const reset = useResetFeed(account.workspaceId, account.id)
  const [, setSearchParams] = useSearchParams()

  const toHead = () => {
    reset()
    if (at) {
      setSearchParams({})
    }
  }

  return <Feed workspaceId={account.workspaceId} feed={feed} account={account} focus={at} toHead={toHead} />
}

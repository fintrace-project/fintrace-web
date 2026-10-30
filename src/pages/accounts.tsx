import { Plus } from 'lucide-react'
import { useParams } from 'react-router'
import { AccountAvatar, Pending, TotalsTiles } from '@/components/cards'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { formatBalance } from '@/core/format'
import { useAccountRows, type AccountRow } from '@/hooks/use-accounts'

export function AccountsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const { isPending, error, retry, rows } = useAccountRows(workspaceId)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Accounts" />
      <TotalsTiles />

      {error ? (
        <LoadError what="accounts" error={error} onRetry={retry} />
      ) : isPending || !rows ? (
        <Pending>Loading…</Pending>
      ) : (
        <>
          {rows.length === 0 && <Pending>No accounts yet.</Pending>}
          <section aria-label="Accounts" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <AccountCard key={row.account.id} row={row} />
            ))}
            {/* Not a button until it does something: creating an account is 4.4 */}
            <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-input text-muted-foreground">
              <Plus className="size-6" aria-hidden />
              <span className="text-[15px] font-semibold">Add account</span>
              <span className="text-xs">Arrives with 4.4</span>
            </div>
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

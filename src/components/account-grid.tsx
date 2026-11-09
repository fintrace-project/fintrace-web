import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CardHeader, EntityTile, MoreTile } from '@/components/entity-tile'
import type { Account } from '@/core/api'
import { formatBalance } from '@/core/format'
import { recentAccountIds, recentFirst, withChosen } from '@/core/recent'
import { useAccountBalances } from '@/hooks/use-accounts'
import { useWorkspaceFeed } from '@/hooks/use-feed'
import { pill } from '@/lib/pill'
import { cn } from '@/lib/utils'

// Two rows of four, the last tile being More when there are more accounts than fit
const TILES = 7
const RECENT = 50

// Folded, the account is a pill beside the date; it opens the card below in place
export function AccountPill({
  label,
  account,
  open,
  onToggle,
  invalid,
  className,
}: {
  label: string
  account: Account
  open: boolean
  onToggle: () => void
  invalid: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-invalid={invalid}
      onClick={onToggle}
      className={cn(pill, className)}
    >
      <span className="sr-only">{label}</span>
      <span className="truncate">{account.name}</span>
      <ChevronDown aria-hidden className={cn(open && 'rotate-180')} />
    </button>
  )
}

// Built as the category card is: the open accounts as tiles on a white card, the recently used first, each
// with its balance from Core; More opens the rest in place, the search beside the heading finds any
export function AccountGrid({
  workspaceId,
  accounts,
  value,
  onChange,
}: {
  workspaceId: string
  accounts: Account[]
  value: string
  onChange: (accountId: string) => void
}) {
  const { t } = useTranslation()
  const feed = useWorkspaceFeed(workspaceId)
  const balances = useAccountBalances(workspaceId)
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  const balanceOf = new Map(balances.data?.map((row) => [row.accountId, row]))
  const ordered = recentFirst(
    accounts,
    recentAccountIds(feed.data?.pages.flatMap((page) => page.items) ?? [], RECENT),
  )
  // Eight fit without a More tile
  const folds = ordered.length > TILES + 1
  const chosen = accounts.find((account) => account.id === value)

  const query = search.trim().toLocaleLowerCase()
  const shown = query
    ? ordered.filter((account) => `${account.name} ${account.currency}`.toLocaleLowerCase().includes(query))
    : !folds || expanded
      ? ordered
      : withChosen(ordered, chosen, TILES)

  const choose = (accountId: string) => {
    onChange(accountId)
    setExpanded(false)
    setSearch('')
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-3">
      <CardHeader
        title={t('operations.form.account')}
        search={search}
        onSearch={setSearch}
        label={t('operations.form.searchAccounts')}
      />
      <div className="grid grid-cols-4 gap-x-2 gap-y-2 empty:hidden">
        {shown.map((account) => (
          <EntityTile
            key={account.id}
            entity={account}
            ring={account.id === value ? 'full' : 'none'}
            sub={formatBalance(balanceOf.get(account.id))}
            onClick={() => choose(account.id)}
          />
        ))}
        {folds && !query && (
          <MoreTile
            expanded={expanded}
            onToggle={() => {
              setExpanded(!expanded)
              setSearch('')
            }}
          />
        )}
      </div>
      {query && shown.length === 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">{t('operations.form.noAccount')}</p>
      )}
    </div>
  )
}

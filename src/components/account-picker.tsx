import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon } from '@/components/entity-icon'
import { PickerList, PickerPopup, PickerTrigger, RecentChips } from '@/components/entity-picker'
import { CommandItem } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import type { Account } from '@/core/api'
import { formatBalance } from '@/core/format'
import { recentAccountIds } from '@/core/recent'
import { useAccountBalances } from '@/hooks/use-accounts'
import { useWorkspaceFeed } from '@/hooks/use-feed'

const RECENT = 6

// The field showing the account, the recent ones as chips, and the open accounts to search, each with
// its balance from Core
export function AccountPicker({
  workspaceId,
  accounts,
  value,
  onChange,
  error,
}: {
  workspaceId: string
  accounts: Account[]
  value: string
  onChange: (accountId: string) => void
  error: string | undefined
}) {
  const { t } = useTranslation()
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const balances = useAccountBalances(workspaceId)
  const feed = useWorkspaceFeed(workspaceId)

  const balanceOf = new Map(balances.data?.map((row) => [row.accountId, row]))
  const offered = new Map(accounts.map((account) => [account.id, account]))
  const selected = offered.get(value)
  const recent = recentAccountIds(feed.data?.pages.flatMap((page) => page.items) ?? [], RECENT)
    .map((id) => offered.get(id))
    .filter((account) => account !== undefined)

  // Every opening starts from the whole list
  const openList = (next: boolean) => {
    setOpen(next)
    setSearch('')
  }
  const choose = (accountId: string) => {
    onChange(accountId)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* The avatar and the name say what the field is; the label stays for screen readers */}
      <Label htmlFor={fieldId} className="sr-only">
        {t('operations.form.account')}
      </Label>
      <PickerPopup
        title={t('operations.form.account')}
        open={open}
        onOpenChange={openList}
        trigger={
          <PickerTrigger id={fieldId} aria-invalid={!!error}>
            {selected && <EntityIcon entity={selected} className="size-8 rounded-lg text-xs" />}
            <span className="min-w-0 flex-1 truncate">{selected?.name}</span>
          </PickerTrigger>
        }
      >
        <PickerList
          value={value}
          search={search}
          onSearch={setSearch}
          placeholder={t('operations.form.searchAccounts')}
          empty={t('operations.form.noAccount')}
        >
          {accounts.map((account) => (
            <CommandItem
              key={account.id}
              value={account.id}
              keywords={[account.name, account.currency]}
              data-checked={account.id === value}
              onSelect={() => choose(account.id)}
              className="min-h-11 gap-3"
            >
              <EntityIcon entity={account} className="size-8 rounded-lg text-xs" />
              <span className="min-w-0 flex-1 truncate">{account.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatBalance(balanceOf.get(account.id))}
              </span>
            </CommandItem>
          ))}
        </PickerList>
      </PickerPopup>
      <RecentChips
        items={recent}
        value={value}
        onChange={onChange}
        icon={(account) => <EntityIcon entity={account} className="size-6 rounded-md text-[10px]" />}
        allLabel={t('operations.form.all')}
        onAll={() => openList(true)}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

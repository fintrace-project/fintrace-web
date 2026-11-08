import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EntityIcon } from '@/components/entity-icon'
import { PickerList, PickerPopup, pickerRow, pill } from '@/components/entity-picker'
import { CommandItem } from '@/components/ui/command'
import type { Account } from '@/core/api'
import { formatBalance } from '@/core/format'
import { useAccountBalances } from '@/hooks/use-accounts'

// A pill naming the account, opening the open accounts to search, each with its balance from Core
export function AccountPicker({
  workspaceId,
  accounts,
  value,
  onChange,
  invalid,
}: {
  workspaceId: string
  accounts: Account[]
  value: string
  onChange: (accountId: string) => void
  invalid: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const balances = useAccountBalances(workspaceId)

  const balanceOf = new Map(balances.data?.map((row) => [row.accountId, row]))
  const selected = accounts.find((account) => account.id === value)

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
    <PickerPopup
      workspaceId={workspaceId}
      title={t('operations.form.account')}
      open={open}
      onOpenChange={openList}
      trigger={
        <button type="button" aria-invalid={invalid} className={pill}>
          <span className="sr-only">{t('operations.form.account')}</span>
          <span className="truncate">{selected?.name}</span>
          <ChevronDown aria-hidden />
        </button>
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
            className={pickerRow}
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
  )
}

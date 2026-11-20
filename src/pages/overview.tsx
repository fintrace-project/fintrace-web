import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ArchiveButton } from '@/components/archive-controls'
import { BalancePanel } from '@/components/balance-panel'
import { TotalsTiles } from '@/components/cards'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Panel, Pending } from '@/components/panel'
import { ExpensesPanel } from '@/components/expenses-panel'
import { Feed } from '@/components/feed'
import { HeatmapCard } from '@/components/heatmap-card'
import { LoadError } from '@/components/load-error'
import { AddOperationButton } from '@/components/operation-dialog'
import { PageHeader } from '@/components/page-header'
import { PresetPicker } from '@/components/preset-picker'
import { TopCategoriesList } from '@/components/top-categories'
import { presetWindow, type Preset } from '@/core/charts/windows'
import { displayCurrency } from '@/core/currencies'
import { addDays, isoDate } from '@/core/dates'
import { useCashflowYears } from '@/hooks/use-cashflow'
import { formatBalance } from '@/core/format'
import { useAccountRows, useCurrencyTotals } from '@/hooks/use-accounts'
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
  // Picked in the balance widget, followed by the balance chart beside it
  const [picked, setPicked] = useState<string>()
  const held = useCurrencyTotals(workspaceId).data?.byCurrency.map((amount) => amount.currency) ?? []
  const display = displayCurrency(held, picked, workspace.defaultCurrency)

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
      <TotalsTiles workspace={workspace} display={display} onPick={setPicked} />
      <HeatmapCard workspaceId={workspaceId} currency={display} />

      {/* Between md and lg the side column comes first: below a feed that keeps loading it could never be reached */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <aside
          aria-label={t('overview.summary')}
          className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1"
        >
          <BalancePanel workspaceId={workspaceId} currency={display} />
          <WhereMoneyWent workspaceId={workspaceId} currency={display} />
          <ExpensesPanel workspaceId={workspaceId} currency={display} className="md:max-lg:hidden" />
          <AccountsPanel workspaceId={workspaceId} />
        </aside>

        {wide && <Operations workspaceId={workspaceId} />}
      </div>
    </div>
  )
}

// The five largest expense categories over a span picked as the balance panel's is, the rest Core's "other"
function WhereMoneyWent({ workspaceId, currency }: { workspaceId: string; currency: string }) {
  const { t } = useTranslation()
  const [today] = useState(() => isoDate(new Date()))
  const [preset, setPreset] = useState<Preset>('1M')
  // "All" begins with the first year holding an operation; until the years arrive a year back stands in
  const firstYear = useCashflowYears(workspaceId).years?.at(-1)
  const span = { from: firstYear ? `${firstYear}-01-01` : addDays(today, -365), to: today }
  const window = presetWindow(preset, span)

  return (
    <Panel
      title={t('overview.whereMoneyWent')}
      className="md:max-lg:hidden"
      // Below the list as in the prototype: beside the title it squeezes both onto two lines
      footer={
        <MoreLink to={`/w/${workspaceId}/statistics?currency=${encodeURIComponent(currency)}`}>
          {t('overview.allStatistics')}
        </MoreLink>
      }
    >
      <TopCategoriesList
        workspaceId={workspaceId}
        kind="EXPENSE"
        currency={currency}
        limit={5}
        // All time is Core's own: without a `from` it starts at the first operation
        window={preset === 'ALL' ? undefined : window}
      />
      <PresetPicker history={span} window={window} onPick={(_, picked) => setPreset(picked)} small />
    </Panel>
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

// A full touch target; the panel's footer or the caller places it
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
      action={
        // Overlapping the padding, so the title row keeps the title's height
        <MoreLink to={`/w/${workspaceId}/accounts`} className="-my-3">
          {t('overview.allAccounts')}
        </MoreLink>
      }
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

import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { BalanceChartView } from '@/components/balance-chart'
import { LoadError } from '@/components/load-error'
import { PageHeader } from '@/components/page-header'
import { PresetPicker } from '@/components/preset-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Account, BalanceSeries } from '@/core/api'
import {
  currenciesOf,
  dailyFetchWindow,
  granularityFor,
  lineOf,
  type DateWindow,
} from '@/core/charts/windows'
import { isoDate } from '@/core/dates'
import { useAccounts } from '@/hooks/use-accounts'
import { useBalanceSeries } from '@/hooks/use-balance-series'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export function ChartsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const { t } = useTranslation()
  const [today] = useState(() => isoDate(new Date()))
  const [accountId, setAccountId] = useState<string>()
  const [picked, setPicked] = useState<DateWindow>()
  // A wheel scrolls the page over a chart, so how to zoom with one is said; touch pinches as it would anyway
  const mouse = useMediaQuery('(pointer: fine)')

  // The monthly series of the whole history fixes where "All" begins; Core starts it at the first activity
  const history = useBalanceSeries(workspaceId, { granularity: 'MONTH', accountId })
  const span =
    history.data && history.data.buckets.length > 0 ? { from: history.data.from, to: today } : undefined
  const window = picked ?? span
  const granularity = window ? granularityFor(window) : 'MONTH'
  const fetched = granularity === 'DAY' && window ? dailyFetchWindow(window, today) : undefined
  const series = useBalanceSeries(workspaceId, {
    granularity,
    from: fetched?.from,
    to: fetched?.to,
    accountId,
  })

  const pickAccount = (id: string | undefined) => {
    setAccountId(id)
    setPicked(undefined)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.charts')} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <AccountPicker workspaceId={workspaceId} accountId={accountId} onPick={pickAccount} />
        {span && window && (
          <>
            <PresetPicker history={span} window={window} onPick={setPicked} />
            <span className="text-sm text-muted-foreground sm:ml-auto">
              {t(`charts.granularity.${granularity}`)} · {t(mouse ? 'charts.mouseHint' : 'charts.touchHint')}
            </span>
          </>
        )}
      </div>

      {history.error || series.error ? (
        <LoadError
          title={t('errors.loadSeries')}
          error={(history.error ?? series.error)!}
          onRetry={() => {
            void history.refetch()
            void series.refetch()
          }}
        />
      ) : !history.data || !series.data ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !span || !window ? (
        <p className="text-sm text-muted-foreground">{t('charts.empty')}</p>
      ) : (
        <Charts
          workspaceId={workspaceId}
          series={series.data}
          window={window}
          today={today}
          onWindow={setPicked}
        />
      )}
    </div>
  )
}

function Charts({
  workspaceId,
  series,
  window,
  today,
  onWindow,
}: {
  workspaceId: string
  series: BalanceSeries
  window: DateWindow
  today: string
  onWindow: (window: DateWindow) => void
}) {
  const currencies = currenciesOf(series)
  return (
    <div className="flex flex-col gap-4">
      {currencies.map((currency) => (
        <CurrencyChart
          key={currency}
          group={`balances-${workspaceId}`}
          currency={currency}
          series={series}
          window={window}
          today={today}
          onWindow={onWindow}
        />
      ))}
    </div>
  )
}

function CurrencyChart({
  series,
  currency,
  today,
  ...chart
}: {
  group: string
  currency: string
  series: BalanceSeries
  window: DateWindow
  today: string
  onWindow: (window: DateWindow) => void
}) {
  const points = useMemo(() => lineOf(series, currency, today), [series, currency, today])
  return (
    <section aria-label={currency} className="flex flex-col gap-2 rounded-2xl border bg-card px-4 py-3">
      <h2 className="text-sm font-bold">{currency}</h2>
      <BalanceChartView currency={currency} points={points} {...chart} />
    </section>
  )
}

// "All accounts" or one: one account holds one currency, so one chart
function AccountPicker({
  workspaceId,
  accountId,
  onPick,
}: {
  workspaceId: string
  accountId: string | undefined
  onPick: (accountId: string | undefined) => void
}) {
  const accounts = useAccounts(workspaceId)
  const { t } = useTranslation()
  const label = (account: Account) =>
    account.archived ? t('charts.archivedAccount', { name: account.name }) : account.name
  const current = accounts.data?.find((account) => account.id === accountId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('charts.account')}
        className="flex min-h-11 items-center gap-2 rounded-xl border bg-card px-3 text-left text-sm font-semibold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-9"
      >
        <span className="min-w-0 flex-1 truncate">{current ? label(current) : t('charts.allAccounts')}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => onPick(undefined)}>
          <Check className={cn('size-4', accountId ? 'invisible' : '')} aria-hidden />
          {t('charts.allAccounts')}
        </DropdownMenuItem>
        {accounts.data?.map((account) => (
          <DropdownMenuItem key={account.id} onSelect={() => onPick(account.id)}>
            <Check className={cn('size-4', account.id === accountId ? '' : 'invisible')} aria-hidden />
            {label(account)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

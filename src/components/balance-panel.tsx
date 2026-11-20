import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { BalanceChartView } from '@/components/balance-chart'
import { Panel, Pending } from '@/components/panel'
import { LoadError } from '@/components/load-error'
import { PresetPicker } from '@/components/preset-picker'
import { granularityFor, lineOf, presetWindow, type Preset } from '@/core/charts/windows'
import { addDays, isoDate } from '@/core/dates'
import { formatShortDate, splitMoney } from '@/core/format'
import { useCurrencyTotals } from '@/hooks/use-accounts'
import { useBalanceSeries } from '@/hooks/use-balance-series'

const noop = () => {}

// The overview's glance at the balance in the display currency the balance widget picks: today's figure, a
// span to look back over, the line across it. Nothing to zoom or select in the chart; the Charts page is for that.
export function BalancePanel({ workspaceId, currency }: { workspaceId: string; currency: string }) {
  const { t } = useTranslation()
  const [today] = useState(() => isoDate(new Date()))
  const [preset, setPreset] = useState<Preset>('1Y')

  // The monthly whole history fixes where "All" begins; until it arrives a year back stands in
  const history = useBalanceSeries(workspaceId, { granularity: 'MONTH' })
  const span =
    history.data && history.data.buckets.length > 0
      ? { from: history.data.from, to: today }
      : { from: addDays(today, -365), to: today }
  const window = presetWindow(preset, span)
  const series = useBalanceSeries(workspaceId, {
    granularity: granularityFor(window),
    from: window.from,
    to: window.to,
  })
  const points = useMemo(
    () => (series.data ? lineOf(series.data, currency, today) : []),
    [series.data, currency, today],
  )

  const total = useCurrencyTotals(workspaceId).data?.byCurrency.find((amount) => amount.currency === currency)
  const figure = total && splitMoney(total.total, currency)

  return (
    <Panel
      title={t('overview.balance')}
      action={
        <Link
          to={`/w/${workspaceId}/charts`}
          className="flex min-h-11 items-center px-1 text-caption font-bold whitespace-nowrap"
        >
          {t('overview.allCharts')}
        </Link>
      }
    >
      <div className="-mt-2 flex flex-col gap-1">
        <p className="text-3xl leading-none font-extrabold tracking-tight">
          {figure ? (
            <>
              {figure.whole}
              <span className="text-xl text-muted-foreground">{figure.fraction}</span>
            </>
          ) : (
            <span aria-hidden className="text-muted-foreground/40">
              —
            </span>
          )}
        </p>
        {/* The change over the span is Core's to compute (3.15); its place holds a placeholder until then */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-semibold">
            {t('overview.changePending')}
          </span>
          {t('overview.since', { date: formatShortDate(window.from) })}
        </p>
      </div>

      {series.error ? (
        <LoadError
          title={t('errors.loadSeries')}
          error={series.error}
          onRetry={() => void series.refetch()}
        />
      ) : !series.data ? (
        <Pending>{t('common.loading')}</Pending>
      ) : points.length === 0 ? (
        <Pending>{t('charts.empty')}</Pending>
      ) : (
        <BalanceChartView
          group={`overview-${workspaceId}`}
          currency={currency}
          points={points}
          window={window}
          onWindow={noop}
          compact
          className="h-36"
        />
      )}

      <PresetPicker history={span} window={window} onPick={(_, picked) => setPreset(picked)} small />
    </Panel>
  )
}

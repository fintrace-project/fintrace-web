import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { HeatmapGrid } from '@/components/heatmap-grid'
import { LoadError } from '@/components/load-error'
import type { Cashflow } from '@/core/api'
import type { CashflowPoint } from '@/core/charts/cashflow-chart'
import { cashflowOf } from '@/core/charts/windows'
import { isoDate } from '@/core/dates'
import { formatCount, formatFeedDay, formatMoney, formatShortDate, splitMoney } from '@/core/format'
import {
  heatmapLayout,
  heatmapWindow,
  spendingFacts,
  type HeatmapMode,
  type HeatmapPeriod,
  type SpendingFacts,
} from '@/core/heatmap'
import { useCashflowYears, useDailyCashflow } from '@/hooks/use-cashflow'
import { cn } from '@/lib/utils'

const MODES: HeatmapMode[] = ['SPENDING', 'TRANSACTIONS', 'NET']
const SHADES = [0.3, 0.5, 0.75, 1]

const money = (amount: number, currency: string) => formatMoney(amount, currency).replace('-', '−')

// The overview's year of days, GitHub-style (4.20): every figure Core's — the daily buckets and the period's
// totals — and the chips only counted and compared over them. In the display currency, its accounts alone.
export function HeatmapCard({ workspaceId, currency }: { workspaceId: string; currency: string }) {
  const { t } = useTranslation()
  const [today] = useState(() => isoDate(new Date()))
  const [period, setPeriod] = useState<HeatmapPeriod>('LAST_YEAR')
  const [mode, setMode] = useState<HeatmapMode>('SPENDING')
  const [picked, setPicked] = useState<string>()

  const window = useMemo(() => heatmapWindow(period, today), [period, today])
  const daily = useDailyCashflow(workspaceId, window)
  const { years } = useCashflowYears(workspaceId)
  const days = useMemo(() => (daily.data ? cashflowOf(daily.data, currency) : []), [daily.data, currency])
  const layout = useMemo(
    () => heatmapLayout(period, window, days, mode, today),
    [period, window, days, mode, today],
  )
  const facts = useMemo(() => spendingFacts(days), [days])

  // A day picked in another period falls back to the newest day of this one
  const selected = picked && picked >= window.from && picked <= window.to ? picked : window.to
  const day = days.find((each) => each.start === selected)

  return (
    <section
      aria-label={t('heatmap.title')}
      className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card px-4 py-4 md:px-6 lg:flex-row lg:gap-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* The scope sits right under the figure it qualifies, not under the toggle's taller row */}
          <div className="flex flex-col gap-1">
            <Headline cashflow={daily.data} mode={mode} currency={currency} />
            <p className="text-xs text-muted-foreground">
              {t('heatmap.scope', {
                from: formatShortDate(window.from),
                to: formatShortDate(window.to),
                currency,
              })}
            </p>
          </div>
          <ModePicker mode={mode} onPick={setMode} />
        </div>
        <PeriodPicker
          years={years}
          period={period}
          onPick={setPeriod}
          className="flex-row overflow-x-auto [scrollbar-width:none] lg:hidden"
        />

        {daily.error ? (
          <LoadError
            title={t('errors.loadSeries')}
            error={daily.error}
            onRetry={() => void daily.refetch()}
          />
        ) : !daily.data ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : (
          <>
            <Facts cashflow={daily.data} facts={facts} currency={currency} />
            <HeatmapGrid
              layout={layout}
              mode={mode}
              currency={currency}
              selected={selected}
              today={today}
              onSelect={setPicked}
            />
            <Legend mode={mode} />
            <SelectedDay workspaceId={workspaceId} date={selected} day={day} currency={currency} />
          </>
        )}
      </div>
      <PeriodPicker
        years={years}
        period={period}
        onPick={setPeriod}
        className="w-36 flex-col max-lg:hidden"
      />
    </section>
  )
}

// The period's figure for the mode, from Core's totals
function Headline({
  cashflow,
  mode,
  currency,
}: {
  cashflow?: Cashflow
  mode: HeatmapMode
  currency: string
}) {
  const { t } = useTranslation()
  const totals = cashflow?.totals
  const of = (amounts?: { byCurrency: { currency: string; total: number }[] }) =>
    amounts?.byCurrency.find((amount) => amount.currency === currency)?.total
  const count = totals?.count.find((each) => each.currency === currency)?.count
  const amount = of(mode === 'NET' ? totals?.net : totals?.expense)

  if (mode === 'TRANSACTIONS') {
    return (
      <p className="text-2xl leading-none font-extrabold tracking-tight">
        {count === undefined ? '—' : t('heatmap.transactions', { count })}
      </p>
    )
  }
  if (amount === undefined) return <p className="text-2xl leading-none font-extrabold">—</p>
  const { whole, fraction } = splitMoney(amount, currency)
  const income = of(totals?.income)
  const expense = of(totals?.expense)
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {/* Spending is money out, in the expense colour; net takes its sign's, and none at zero */}
      <p
        className={cn(
          'text-2xl leading-none font-extrabold tracking-tight',
          mode === 'SPENDING' || amount < 0 ? 'text-negative' : amount > 0 && 'text-positive',
        )}
      >
        <span className="sr-only">{t(mode === 'NET' ? 'heatmap.netLabel' : 'heatmap.spentLabel')} </span>
        {whole}
        <span className="text-lg opacity-60">{fraction}</span>
        <span className="ml-1.5 text-base font-bold text-muted-foreground" aria-hidden>
          {t(mode === 'NET' ? 'heatmap.net' : 'heatmap.spent')}
        </span>
      </p>
      {/* What the net is the difference of, both Core's totals, signed by their side as the feeds sign them */}
      {mode === 'NET' && income !== undefined && expense !== undefined && (
        <p className="text-sm font-bold whitespace-nowrap">
          <span className="text-positive">
            <span className="sr-only">{t('heatmap.dayIncome')} </span>+{money(income, currency)}
          </span>
          <span className="mx-1.5 text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="text-negative">
            <span className="sr-only">{t('heatmap.daySpent')} </span>−{money(expense, currency)}
          </span>
        </p>
      )}
    </div>
  )
}

function ModePicker({ mode, onPick }: { mode: HeatmapMode; onPick: (mode: HeatmapMode) => void }) {
  const { t } = useTranslation()
  return (
    <div
      role="group"
      aria-label={t('heatmap.mode')}
      className="flex gap-1 self-start rounded-xl bg-muted/60 p-1"
    >
      {MODES.map((each) => (
        <button
          key={each}
          type="button"
          aria-pressed={each === mode}
          onClick={() => onPick(each)}
          className={cn(
            'min-h-11 rounded-lg px-3 text-sm font-bold transition-colors md:min-h-9',
            each === mode ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`heatmap.modes.${each}`)}
        </button>
      ))}
    </div>
  )
}

// "Last 12 months", then each year holding an operation, newest first
function PeriodPicker({
  years,
  period,
  onPick,
  className,
}: {
  years: number[] | undefined
  period: HeatmapPeriod
  onPick: (period: HeatmapPeriod) => void
  className?: string
}) {
  const { t } = useTranslation()
  const periods: HeatmapPeriod[] = ['LAST_YEAR', ...(years ?? [])]
  return (
    <div role="group" aria-label={t('heatmap.period')} className={cn('flex shrink-0 gap-1', className)}>
      {periods.map((each) => (
        <button
          key={each}
          type="button"
          aria-pressed={each === period}
          onClick={() => onPick(each)}
          className={cn(
            'min-h-11 shrink-0 rounded-xl px-4 text-left text-sm font-bold whitespace-nowrap transition-colors md:min-h-10',
            each === period ? 'bg-(--ws) text-white' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {each === 'LAST_YEAR' ? t('heatmap.lastYear') : each}
        </button>
      ))}
    </div>
  )
}

function Facts({
  cashflow,
  facts,
  currency,
}: {
  cashflow: Cashflow
  facts: SpendingFacts
  currency: string
}) {
  const { t } = useTranslation()
  const perDay = cashflow.totals.perDay.expense.byCurrency.find((amount) => amount.currency === currency)
  const chips: [string, string][] = [
    [t('heatmap.avgPerDay'), perDay ? money(perDay.total, currency) : '—'],
    [t('heatmap.noSpendDays'), t('heatmap.days', { count: facts.noSpendDays })],
    [t('heatmap.longestStreak'), t('heatmap.days', { count: facts.longestNoSpendStreak })],
    [
      t('heatmap.biggestDay'),
      facts.biggestDay
        ? t('heatmap.biggest', {
            amount: money(facts.biggestDay.expense, currency),
            date: formatShortDate(facts.biggestDay.start),
          })
        : '—',
    ],
  ]
  return (
    <dl className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 sm:flex sm:flex-wrap">
      {chips.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-sm font-extrabold sm:whitespace-nowrap">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function SelectedDay({
  workspaceId,
  date,
  day,
  currency,
}: {
  workspaceId: string
  date: string
  day?: CashflowPoint
  currency: string
}) {
  const { t } = useTranslation()
  const figures: [string, string][] = day
    ? [
        [t('heatmap.daySpent'), money(day.expense, currency)],
        [t('heatmap.dayIncome'), money(day.income, currency)],
        [t('heatmap.dayTransactions'), formatCount(day.count)],
      ]
    : []

  // A phone: the date and the link on one row, the three figures under them in columns, each its label over
  // its value. From md, one line: the date, the figures, the link at the end.
  return (
    <div
      aria-live="polite"
      className="grid grid-cols-3 items-center gap-x-4 gap-y-2 rounded-xl bg-muted/60 px-4 py-2 text-sm whitespace-nowrap md:flex md:gap-x-6 md:py-1"
    >
      <span className="col-span-2 font-extrabold md:col-auto">
        <span className="sr-only">{t('heatmap.selectedDay')} </span>
        {formatFeedDay(date)}
      </span>
      <Link
        to={`/w/${workspaceId}/operations?day=${date}`}
        className="flex min-h-11 items-center justify-self-end font-bold md:order-last md:ml-auto md:min-h-9"
      >
        {t('heatmap.openInFeed')}
      </Link>
      {figures.map(([label, value]) => (
        <span key={label} className="flex flex-col md:flex-row md:gap-1">
          <span className="text-xs text-muted-foreground md:text-sm md:text-foreground">{label}</span>
          <b>{value}</b>
        </span>
      ))}
    </div>
  )
}

// The shades from none to most; net runs from most spent through nothing to most received
function Legend({ mode }: { mode: HeatmapMode }) {
  const { t } = useTranslation()
  const swatch = (key: string, colour: string, opacity = 1) => (
    <span key={key} className="size-3 rounded-[3px]" style={{ background: colour, opacity }} />
  )
  const muted = swatch('0', 'var(--muted)')
  const scale =
    mode === 'NET'
      ? [
          ...[...SHADES].reverse().map((o) => swatch(`-${o}`, 'var(--negative)', o)),
          muted,
          ...SHADES.map((o) => swatch(`+${o}`, 'var(--positive)', o)),
        ]
      : [muted, ...SHADES.map((o) => swatch(`${o}`, 'var(--ws)', o))]
  return (
    <div aria-hidden className="-mt-2 flex items-center gap-1 self-end text-xs text-muted-foreground">
      <span className="mr-1">{t(mode === 'NET' ? 'heatmap.out' : 'heatmap.less')}</span>
      {scale}
      <span className="ml-1">{t(mode === 'NET' ? 'heatmap.in' : 'heatmap.more')}</span>
    </div>
  )
}

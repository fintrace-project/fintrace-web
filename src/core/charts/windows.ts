import type { BalanceSeries, Granularity } from '@/core/api'
import { addDays, isoDate, localDate } from '@/core/dates'

// A span of whole days, both ends included, as `YYYY-MM-DD`
export interface DateWindow {
  from: string
  to: string
}

export const daysBetween = (from: string, to: string) =>
  Math.round((localDate(to).getTime() - localDate(from).getTime()) / 86_400_000)

// §11.3: the UI picks the granularity from the visible window, Core only answers for it (spike 4.1's thresholds)
export function granularityFor(window: DateWindow): Granularity {
  const days = daysBetween(window.from, window.to)
  if (days > 540) return 'MONTH'
  if (days > 92) return 'WEEK'
  return 'DAY'
}

export const PRESETS = ['ALL', '1Y', '3M', '1M'] as const
export type Preset = (typeof PRESETS)[number]

const PRESET_DAYS: Record<Exclude<Preset, 'ALL'>, number> = { '1Y': 365, '3M': 91, '1M': 30 }

// The window a preset shows, ending where the history ends and never starting before it
export function presetWindow(preset: Preset, history: DateWindow): DateWindow {
  if (preset === 'ALL') return history
  const from = addDays(history.to, -PRESET_DAYS[preset])
  return { from: from < history.from ? history.from : from, to: history.to }
}

// A daily window is fetched alone, the whole history at DAY passing Core's 2,000-bucket cap: widened by a month
// each side and snapped to whole months, so panning within them asks for nothing new
export function dailyFetchWindow(window: DateWindow, today: string): DateWindow {
  const from = addDays(window.from, -31).slice(0, 8) + '01'
  const to = bucketEnd(addDays(window.to, 31).slice(0, 8) + '01', 'MONTH')
  return { from, to: to < today ? to : today }
}

// The bucket's last day, where its balance is drawn: Core's figure is the balance at the bucket's end (§11.4)
export function bucketEnd(start: string, granularity: Granularity): string {
  const d = localDate(start)
  const next = {
    DAY: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    WEEK: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7),
    MONTH: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    YEAR: new Date(d.getFullYear() + 1, 0, 1),
  }[granularity]
  return addDays(isoDate(next), -1)
}

// One currency's line: each bucket's figure for it, drawn at the bucket's end and never after `today`, where
// the current bucket's figure was measured. Every bucket carries every currency (D3); nothing is summed.
export function lineOf(series: BalanceSeries, currency: string, today: string): [string, number][] {
  return series.buckets.flatMap(({ start, balance }) => {
    const figure = balance.byCurrency.find((amount) => amount.currency === currency)
    if (!figure) return []
    const end = bucketEnd(start, series.granularity)
    return [[end < today ? end : today, figure.total] as [string, number]]
  })
}

// The currencies a series holds, in Core's order, for one chart each
export const currenciesOf = (series: BalanceSeries) =>
  series.buckets[0]?.balance.byCurrency.map((amount) => amount.currency) ?? []

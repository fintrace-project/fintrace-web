import { bucketEnd, type DateWindow } from '@/core/charts/windows'
import { isoDate, localDate } from '@/core/dates'

// The Statistics page's period: a calendar month (`YYYY-MM`), a calendar year (`YYYY`), or all time
export type Period = { kind: 'month'; month: string } | { kind: 'year'; year: string } | { kind: 'all' }

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const YEAR = /^\d{4}$/

// From the URL's `?period=`: `year` is this year; anything else, or a month or year after today's, is this month
export function parsePeriod(value: string | null, today: string): Period {
  if (value === 'all') return { kind: 'all' }
  if (value === 'year') return { kind: 'year', year: today.slice(0, 4) }
  if (value && YEAR.test(value) && value <= today.slice(0, 4)) return { kind: 'year', year: value }
  const current = today.slice(0, 7)
  return value && MONTH.test(value) && value <= current
    ? { kind: 'month', month: value }
    : { kind: 'month', month: current }
}

export const periodParam = (period: Period) =>
  period.kind === 'month' ? period.month : period.kind === 'year' ? period.year : period.kind

// The days Core is asked for, never past today; none for all time, where Core starts at the first operation
export function periodWindow(period: Period, today: string): DateWindow | undefined {
  if (period.kind === 'all') return undefined
  const [from, end] =
    period.kind === 'year'
      ? [`${period.year}-01-01`, `${period.year}-12-31`]
      : [`${period.month}-01`, bucketEnd(`${period.month}-01`, 'MONTH')]
  return { from, to: end < today ? end : today }
}

export function shiftMonth(month: string, by: number): string {
  const d = localDate(`${month}-01`)
  return isoDate(new Date(d.getFullYear(), d.getMonth() + by, 1)).slice(0, 7)
}

import type { Cashflow } from '@/core/api'
import { addDays, localDate } from '@/core/dates'
import type { CashflowPoint } from '@/core/charts/cashflow-chart'
import type { DateWindow } from '@/core/charts/windows'

// "Last 12 months" or a calendar year (4.20)
export type HeatmapPeriod = 'LAST_YEAR' | number

// The days a period covers: a year back to today, or a calendar year stopped at today, so no future day is asked for
export function heatmapWindow(period: HeatmapPeriod, today: string): DateWindow {
  if (period === 'LAST_YEAR') {
    // Today a year ago, the 28th standing in for a 29 February the year before lacks; the window starts the day after
    const yearAgo = `${Number(today.slice(0, 4)) - 1}${today.slice(4).replace('-02-29', '-02-28')}`
    return { from: addDays(yearAgo, 1), to: today }
  }
  const last = `${period}-12-31`
  return { from: `${period}-01-01`, to: last < today ? last : today }
}

// The calendar years holding an operation, newest first, from a yearly cashflow with no `from`: Core starts it at
// the first operation, so its buckets are exactly those years
export const yearsOf = (yearly: Cashflow): number[] =>
  yearly.buckets.map((bucket) => Number(bucket.start.slice(0, 4))).reverse()

// What a cell's colour stands for: the day's expense, its operations, or its net (signed, two hues)
export type HeatmapMode = 'SPENDING' | 'TRANSACTIONS' | 'NET'

export interface HeatmapCell {
  date: string
  // A day the period covers but that has not come yet: outlined, unfilled
  future: boolean
  // The day's bucket as Core sent it; absent for a future day
  day?: CashflowPoint
  // 0 for nothing, 1–4 by quantile of the period's non-zero days; negative for a net below zero
  level: number
}

export interface HeatmapLayout {
  // Weeks from Monday, each seven slots; a slot outside the period is null
  weeks: (HeatmapCell | null)[][]
  // A month's short name over the column its first day falls in
  months: { column: number; date: string }[]
}

export const valueOf = (day: CashflowPoint, mode: HeatmapMode) =>
  mode === 'SPENDING' ? day.expense : mode === 'TRANSACTIONS' ? day.count : day.net

// Cut points at the quarters of the sorted non-zero values: comparing and counting only, no figure computed, so a
// single large day leaves the rest their own shades rather than paling them all
function quartiles(values: number[]): number[] {
  const sorted = values.filter((value) => value !== 0).sort((a, b) => a - b)
  return [0.25, 0.5, 0.75].map((q) => sorted[Math.floor(q * (sorted.length - 1))] ?? 0)
}

const levelIn = (value: number, cuts: number[]) => 1 + cuts.filter((cut) => value > cut).length

// The grid for a period: the whole calendar year when one is shown, future days included, else the window. Net
// is cut on each side of zero apart, so the two hues each use all their shades.
export function heatmapLayout(
  period: HeatmapPeriod,
  window: DateWindow,
  days: CashflowPoint[],
  mode: HeatmapMode,
  today: string,
): HeatmapLayout {
  const span = period === 'LAST_YEAR' ? window : { from: `${period}-01-01`, to: `${period}-12-31` }
  const byDate = new Map(days.map((day) => [day.start, day]))
  const values = days.map((day) => valueOf(day, mode))
  const upper = quartiles(values.filter((value) => value > 0))
  const lower = quartiles(values.filter((value) => value < 0).map((value) => -value))

  const level = (day: CashflowPoint | undefined) => {
    const value = day ? valueOf(day, mode) : 0
    if (value === 0) return 0
    return value > 0 ? levelIn(value, upper) : -levelIn(-value, lower)
  }

  const weeks: (HeatmapCell | null)[][] = []
  const months: HeatmapLayout['months'] = []
  // Monday on or before the span's first day; getDay() is 0 for Sunday
  const first = localDate(span.from)
  let date = addDays(span.from, -((first.getDay() + 6) % 7))
  while (date <= span.to) {
    const week: (HeatmapCell | null)[] = []
    for (let slot = 0; slot < 7; slot++, date = addDays(date, 1)) {
      if (date < span.from || date > span.to) {
        week.push(null)
        continue
      }
      if (date.endsWith('-01') || date === span.from) months.push({ column: weeks.length, date })
      const day = byDate.get(date)
      week.push({ date, future: date > today, day, level: level(day) })
    }
    weeks.push(week)
  }
  // A label for the span's first days is dropped when the first full month's would sit on top of it
  if (months.length > 1 && months[1]!.column - months[0]!.column < 3 && !months[0]!.date.endsWith('-01')) {
    months.shift()
  }
  return { weeks, months }
}

export interface SpendingFacts {
  noSpendDays: number
  longestNoSpendStreak: number
  // The day with the largest expense as Core sent it, or none when nothing was spent
  biggestDay?: CashflowPoint
}

// Counted and compared over the period's days, never summed (4.20): Core's buckets arrive one a day, in order
export function spendingFacts(days: CashflowPoint[]): SpendingFacts {
  let noSpendDays = 0
  let streak = 0
  let longestNoSpendStreak = 0
  let biggestDay: CashflowPoint | undefined
  for (const day of days) {
    if (day.expense === 0) {
      noSpendDays++
      streak++
      longestNoSpendStreak = Math.max(longestNoSpendStreak, streak)
    } else {
      streak = 0
      if (!biggestDay || day.expense > biggestDay.expense) biggestDay = day
    }
  }
  return { noSpendDays, longestNoSpendStreak, biggestDay }
}

// Floating local wall-clock values, as Core stores them: never converted to UTC (§6.4).
const pad = (n: number) => String(n).padStart(2, '0')

export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// A `YYYY-MM-DD` as local midnight, for widgets that take a Date; `isoDate` turns it back
export function localDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

// Calendar arithmetic on the date's own fields, so no time zone and no daylight-saving shift enters it
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return isoDate(new Date(year!, month! - 1, day! + days))
}

export function nowLocal(): string {
  const d = new Date()
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

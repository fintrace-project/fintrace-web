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

// Comparable as plain strings: Core writes `12:43` for `12:43:00`, and up to six fraction digits
function comparable(at: string): string {
  const [whole = '', fraction = ''] = (at.length === 16 ? `${at}:00` : at).split('.')
  return `${whole}.${fraction.padEnd(6, '0')}`
}

// The instant one microsecond earlier, Core's precision. UTC fields serve only as a calculator: no zone or
// daylight-saving shift enters a floating value.
function microsecondBefore(at: string): string {
  const value = comparable(at)
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const [hours, minutes, seconds] = value.slice(11, 19).split(':').map(Number)
  const total =
    (Date.UTC(year!, month! - 1, day!, hours!, minutes!, seconds!) / 1000) * 1e6 + Number(value.slice(20)) - 1
  const d = new Date(Math.floor(total / 1e6) * 1000)
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` +
    `.${String(total % 1e6).padStart(6, '0')}`
  )
}

// When an operation booking an anchor's difference happened: just before the anchor, since one at its instant
// counts in neither the difference nor the balance after it, and after the previous anchor, or it would fill
// that one's gap (§4.6). Null when nothing lies between the two, as among import's anchors 1 µs apart.
export function justBeforeAnchor(anchorAt: string, previousAt: string | undefined): string | null {
  const at = microsecondBefore(anchorAt)
  return previousAt === undefined || at > comparable(previousAt) ? at : null
}

// Which side of the gap an operation dated `at` lands on, or null inside it: at either anchor's own instant it
// explains neither difference (§4.6)
export function outsideGap(
  at: string,
  anchorAt: string,
  previousAt: string | undefined,
): 'AFTER' | 'BEFORE' | null {
  const value = comparable(at)
  if (value >= comparable(anchorAt)) {
    return 'AFTER'
  }
  return previousAt !== undefined && value <= comparable(previousAt) ? 'BEFORE' : null
}

export function nowLocal(): string {
  const d = new Date()
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

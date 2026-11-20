import type { AccountBalance, OperationFeedItem, UserProfile } from '@/core/api'

// Display only: every figure comes from Core, the client never computes money.
const money = new Map<string, Intl.NumberFormat>()

function moneyFormat(currency: string): Intl.NumberFormat {
  let format = money.get(currency)
  if (!format) {
    // At least two decimals: Intl's customary digits would round Core's 69,807.05 RSD to 69,807
    format = new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 })
    money.set(currency, format)
  }
  return format
}

export function formatMoney(amount: number, currency: string): string {
  return moneyFormat(currency).format(amount)
}

// The figure cut at its decimal separator, so the cents can be set smaller; a true minus, as in the feeds
export function splitMoney(amount: number, currency: string): { whole: string; fraction: string } {
  const parts = moneyFormat(currency).formatToParts(amount)
  const cut = parts.findIndex((part) => part.type === 'decimal')
  const text = (from: number, to?: number) =>
    parts
      .slice(from, to)
      .map((part) => (part.type === 'minusSign' ? '−' : part.value))
      .join('')
  return cut < 0 ? { whole: text(0), fraction: '' } : { whole: text(0, cut), fraction: text(cut) }
}

// "€" for EUR, "$" for USD: the currency's narrow sign, as Intl writes it beside a figure
export const currencySymbol = (currency: string) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currency

export const formatBalance = (balance: AccountBalance | undefined) =>
  // Intl writes a hyphen; the feeds' figures carry a true minus
  balance ? formatMoney(balance.balance, balance.currency).replace('-', '−') : '—'

// The wire's amount is a magnitude: the sign is written from what the caller knows, the figure left as Core sent it
export const formatSignedMagnitude = (amount: number, currency: string, positive: boolean) =>
  `${positive ? '+' : '−'}${formatMoney(amount, currency)}`

export const formatOperationAmount = ({ amount, currency, kind }: OperationFeedItem) =>
  formatSignedMagnitude(amount, currency, kind === 'INCOME')

const rate = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 })

export const formatRate = (value: number) => rate.format(value)

const shortDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatShortDate = (iso: string) => shortDate.format(new Date(`${iso.slice(0, 10)}T00:00`))

const month = new Intl.DateTimeFormat(undefined, { month: 'short' })

// "Nov", for a month's first day
export const formatMonth = (iso: string) => month.format(new Date(`${iso.slice(0, 10)}T00:00`))

const monthYear = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })

// "November 2026", for a month's first day
export const formatMonthYear = (iso: string) => monthYear.format(new Date(`${iso.slice(0, 10)}T00:00`))

const shortMonthYear = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' })

// "Nov 2026", where the full name does not fit
export const formatShortMonthYear = (iso: string) =>
  shortMonthYear.format(new Date(`${iso.slice(0, 10)}T00:00`))

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

// The wire's floating wall-clock value read as local, so the time shown is the time stored
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

const feedDay = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export const formatFeedDay = (iso: string) => feedDay.format(new Date(`${iso.slice(0, 10)}T00:00`))

const pickerDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const pickerDayOfYear = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// The locale's first day of the week, 1 Monday … 7 Sunday; Monday where the browser cannot tell (Firefox)
export function firstDayOfWeek(): number {
  const locale = new Intl.Locale(new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & {
    getWeekInfo?: () => { firstDay: number }
    weekInfo?: { firstDay: number }
  }
  return locale.getWeekInfo?.().firstDay ?? locale.weekInfo?.firstDay ?? 1
}

// "Thu 5 Nov", the year added only when it is not today's
export const formatPickerDay = (iso: string, today: string) =>
  (iso.slice(0, 4) === today.slice(0, 4) ? pickerDay : pickerDayOfYear).format(
    new Date(`${iso.slice(0, 10)}T00:00`),
  )

// Up to two letters: the first of each of the first two words, or the first two of a single word.
export function initials(name: string): string {
  const [first = '', second] = name.match(/[\p{L}\p{N}]+/gu) ?? []
  const letters = second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2)
  return letters.toUpperCase()
}

// "Andrey Sosnov" from the token's names, or the username when the realm holds none
export function displayName(user: UserProfile): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.username
}

const count = new Intl.NumberFormat()

export const formatCount = (n: number) => count.format(n)

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })

// "80K", "−40K", "1.2M": an axis's figure where the currency is named elsewhere; a true minus, as in the feeds
export const formatCompact = (n: number) => compact.format(n).replace('-', '−')

// Bytes, kilobytes or megabytes, the unit's name written by Intl in the user's language
export function formatBytes(bytes: number): string {
  const [value, unit] =
    bytes < 1024
      ? [bytes, 'byte']
      : bytes < 1024 * 1024
        ? [bytes / 1024, 'kilobyte']
        : [bytes / (1024 * 1024), 'megabyte']
  return new Intl.NumberFormat(undefined, { style: 'unit', unit, maximumFractionDigits: 1 }).format(value)
}

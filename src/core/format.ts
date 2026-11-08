import type { AccountBalance, OperationFeedItem, UserProfile } from '@/core/api'

// Display only: every figure comes from Core, the client never computes money.
const money = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number, currency: string): string {
  let format = money.get(currency)
  if (!format) {
    format = new Intl.NumberFormat(undefined, { style: 'currency', currency })
    money.set(currency, format)
  }
  return format.format(amount)
}

export const formatBalance = (balance: AccountBalance | undefined) =>
  balance ? formatMoney(balance.balance, balance.currency) : '—'

// The wire's amount is a magnitude: the sign is written from what the caller knows, the figure left as Core sent it
export const formatSignedMagnitude = (amount: number, currency: string, positive: boolean) =>
  `${positive ? '+' : '−'}${formatMoney(amount, currency)}`

export const formatOperationAmount = ({ amount, currency, kind }: OperationFeedItem) =>
  formatSignedMagnitude(amount, currency, kind === 'INCOME')

const rate = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 })

export const formatRate = (value: number) => rate.format(value)

const shortDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatShortDate = (iso: string) => shortDate.format(new Date(`${iso.slice(0, 10)}T00:00`))

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

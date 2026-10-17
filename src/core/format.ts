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

const shortDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatShortDate = (iso: string) => shortDate.format(new Date(`${iso.slice(0, 10)}T00:00`))

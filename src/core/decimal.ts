// A decimal as typed, a comma accepted for the point; anything else is left to the field's pattern to refuse
export const toDecimal = (typed: string) =>
  typed.trim() === '' ? null : Number(typed.trim().replace(',', '.'))

// What a transfer's two typed amounts imply, for showing while typing only; Core derives the rate it answers with
export const impliedRate = (sent: string, received: string) => {
  const source = toDecimal(sent)
  const target = toDecimal(received)
  return source && target ? target / source : null
}

// Core stores amounts as numeric(19, 4): a fifth digit would be rounded away by the database, silently
const AMOUNT_DIGITS = 4

// The balance once the latest anchor is deleted, for the confirmation only: it moves by exactly the difference
// the anchor absorbed (§10.4). In ten-thousandths, so 1500.1 − 20.05 does not come out as 1480.0499…
export const balanceWithoutAnchor = (balance: number, difference: number) => {
  const scale = 10 ** AMOUNT_DIGITS
  return (Math.round(balance * scale) - Math.round(difference * scale)) / scale
}

const fraction = (least: number) => `([.,]\\d{${least},${AMOUNT_DIGITS}})?`

// A magnitude part-way through typing: digits, then one point or comma and at most four more. The
// whole part may be left out, as in ".44".
export const isTypingAmount = (typed: string) => new RegExp(`^\\d*${fraction(0)}$`).test(typed)

// The same, finished: no point left dangling. For the field's `pattern`, which anchors it itself; an
// empty field is `required`'s to refuse.
export const amountPattern = `\\d*${fraction(1)}`

// ".44" written out as "0.44"
export const withLeadingZero = (typed: string) => (/^[.,]/.test(typed) ? `0${typed}` : typed)

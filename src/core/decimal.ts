// A decimal as typed, a comma accepted for the point; anything else is left to the field's pattern to refuse
export const toDecimal = (typed: string) =>
  typed.trim() === '' ? null : Number(typed.trim().replace(',', '.'))

// Core stores amounts as numeric(19, 4): a fifth digit would be rounded away by the database, silently
const AMOUNT_DIGITS = 4

const fraction = (least: number) => `([.,]\\d{${least},${AMOUNT_DIGITS}})?`

// A magnitude part-way through typing: digits, then one point or comma and at most four more. The
// whole part may be left out, as in ".44".
export const isTypingAmount = (typed: string) => new RegExp(`^\\d*${fraction(0)}$`).test(typed)

// The same, finished: no point left dangling. For the field's `pattern`, which anchors it itself; an
// empty field is `required`'s to refuse.
export const amountPattern = `\\d*${fraction(1)}`

// ".44" written out as "0.44"
export const withLeadingZero = (typed: string) => (/^[.,]/.test(typed) ? `0${typed}` : typed)

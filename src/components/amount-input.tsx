import { amountPattern, isTypingAmount, withLeadingZero } from '@/core/decimal'
import { currencySymbol } from '@/core/format'
import { cn } from '@/lib/utils'

// The form's one large figure, in a white field on the tint. The sign is drawn from the kind, never typed: the
// wire carries a magnitude.
export function AmountInput({
  label,
  value,
  autoFocus,
  onChange,
  income,
  unsigned,
  currency,
  invalid,
}: {
  label: string
  value: string
  autoFocus: boolean
  onChange: (value: string) => void
  income: boolean
  // A same-currency transfer's figure is neither money in nor money out
  unsigned?: boolean
  currency: string
  invalid: boolean
}) {
  return (
    // A white card like the categories' below, borderless; its ring is the wrapper's, so it turns red by what
    // the input inside reports
    <div
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-2xl bg-card px-4 py-2 text-4xl font-extrabold tracking-tight tabular-nums',
        'focus-within:ring-3 focus-within:ring-ring/30',
        'has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/40',
        'has-user-invalid:ring-3 has-user-invalid:ring-destructive/40',
        income && 'text-positive',
      )}
    >
      {/* The sign goes with the figure: the placeholder's shade while there is none, the figure's colour
          once typed, so "−0.00" and "−333" each read as one */}
      {!unsigned && (
        <span aria-hidden className={cn(!value && 'text-muted-foreground/40')}>
          {income ? '+' : '−'}
        </span>
      )}
      <input
        aria-label={label}
        autoFocus={autoFocus}
        aria-invalid={invalid}
        value={value}
        // A keystroke that would make it anything but a decimal is dropped, so the field never holds one
        onChange={(event) => isTypingAmount(event.target.value) && onChange(event.target.value)}
        onBlur={() => onChange(withLeadingZero(value))}
        inputMode="decimal"
        pattern={amountPattern}
        required
        autoComplete="off"
        placeholder="0.00"
        className="h-14 min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/40"
      />
      <span className="shrink-0 text-2xl font-semibold text-muted-foreground">
        {currencySymbol(currency)}
      </span>
    </div>
  )
}

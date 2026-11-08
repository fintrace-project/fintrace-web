import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DialogClose } from '@/components/ui/dialog'
import type { CategoryKind } from '@/core/api'
import { cn } from '@/lib/utils'

export type FormKind = CategoryKind | 'TRANSFER'

// The switch between what is being added, and the round close button beside it. Editing keeps to its own kind's
// side: an operation cannot become a transfer
export function FormHeader({
  value,
  onChange,
  withTransfer,
  transferOnly = false,
}: {
  value: FormKind
  onChange: (kind: FormKind) => void
  withTransfer: boolean
  transferOnly?: boolean
}) {
  const { t } = useTranslation()
  const kinds: FormKind[] = transferOnly
    ? ['TRANSFER']
    : withTransfer
      ? ['EXPENSE', 'INCOME', 'TRANSFER']
      : ['EXPENSE', 'INCOME']
  return (
    <div className="flex items-center justify-between gap-3">
      <KindToggle value={value} onChange={onChange} kinds={kinds} />
      <DialogClose asChild>
        <button
          type="button"
          aria-label={t('common.close')}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X aria-hidden className="size-4" />
        </button>
      </DialogClose>
    </div>
  )
}

// Radios drawn as one switch: the keyboard's arrows move between them, as with any radio group
function KindToggle({
  value,
  onChange,
  kinds,
}: {
  value: FormKind
  onChange: (kind: FormKind) => void
  kinds: FormKind[]
}) {
  const { t } = useTranslation()
  return (
    <fieldset
      className={cn(
        'inline-grid gap-1 rounded-xl bg-card p-1',
        kinds.length === 3 ? 'grid-cols-3' : kinds.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
      )}
    >
      <legend className="sr-only">{t('operations.form.kind')}</legend>
      {kinds.map((kind) => (
        <label
          key={kind}
          className="flex h-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold text-muted-foreground has-checked:bg-(--ws) has-checked:text-white has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
        >
          <input
            type="radio"
            name="operation-kind"
            value={kind}
            checked={value === kind}
            onChange={() => onChange(kind)}
            className="sr-only"
          />
          {t(`operations.kind.${kind}`)}
        </label>
      ))}
    </fieldset>
  )
}

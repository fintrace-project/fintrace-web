import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadError } from '@/components/load-error'
import type { CurrencyAmount, Workspace } from '@/core/api'
import { currencySymbol, splitMoney } from '@/core/format'
import { useCurrencyTotals } from '@/hooks/use-accounts'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

// Each currency's total from Core (4.13a). The converted total and shares wait for conversion (3.10) and the
// month's change for Core to serve it (3.15), so their places hold placeholders; a row picks the currency they
// will be shown in, the workspace's own until then.
export function BalanceWidget({ workspace, className }: { workspace: Workspace; className?: string }) {
  const totals = useCurrencyTotals(workspace.id)
  const [picked, setPicked] = useState<string>()
  const { t } = useTranslation()

  const rows = totals.data?.byCurrency
  const display =
    picked ??
    (rows?.some((row) => row.currency === workspace.defaultCurrency)
      ? workspace.defaultCurrency
      : (rows?.[0]?.currency ?? workspace.defaultCurrency))

  return (
    <section
      aria-label={t('totals.balance')}
      className={cn('flex flex-col gap-2.5 rounded-2xl border bg-card px-4 py-3', className)}
    >
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <h2 className="text-caption">{t('totals.balance')}</h2>
        <span>{t('totals.monthChange', { change: '—' })}</span>
      </div>

      <Headline total={rows?.find((row) => row.currency === display)} />
      <p className="-mt-2 text-xs text-muted-foreground">{t('totals.sourceOnly', { currency: display })}</p>

      {totals.error ? (
        <LoadError
          title={t('errors.loadTotals')}
          error={totals.error}
          onRetry={() => void totals.refetch()}
        />
      ) : !rows ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('accounts.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map(({ currency, total }) => (
            <li key={currency}>
              <CurrencyRow
                currency={currency}
                total={total}
                active={currency === display}
                onPick={() => setPicked(currency)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// The display currency's own total, unconverted, until Core converts the others into it (3.10)
function Headline({ total }: { total: CurrencyAmount | undefined }) {
  if (!total) {
    return (
      <p aria-hidden className="text-3xl leading-none font-extrabold text-muted-foreground/40">
        —
      </p>
    )
  }
  const { whole, fraction } = splitMoney(total.total, total.currency)
  return (
    <p className="text-3xl leading-none font-extrabold tracking-tight">
      {whole}
      <span className="text-xl text-muted-foreground">{fraction}</span>
    </p>
  )
}

function CurrencyRow({
  currency,
  total,
  active,
  onPick,
}: {
  currency: string
  total: number
  active: boolean
  onPick: () => void
}) {
  const { whole, fraction } = splitMoney(total, currency)

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onPick}
      className={cn(
        'flex min-h-11 w-full items-center gap-2.5 rounded-xl border px-2 text-left transition-colors',
        active ? 'border-(--ws) bg-(--ws-soft)' : 'border-transparent bg-muted/50 hover:bg-muted',
      )}
    >
      <span
        aria-hidden
        style={accentOf(currency)}
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--ws-soft) text-[10px] font-extrabold text-(--ws)"
      >
        {currencySymbol(currency)}
      </span>
      <span className="text-sm font-bold">{currency}</span>
      <span className="flex-1 text-xs font-semibold text-muted-foreground">—%</span>
      <span className="text-row font-extrabold whitespace-nowrap">
        {whole}
        <span className="text-caption font-bold text-muted-foreground">{fraction}</span>
      </span>
    </button>
  )
}

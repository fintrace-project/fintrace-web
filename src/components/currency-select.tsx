import { Check, ChevronDown, Search } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { currenciesWith, currencyLabel, matchesCurrency } from '@/core/currencies'
import { cn } from '@/lib/utils'

// A compact trigger ("EUR (€)") opening a searchable list: matches anywhere in the name, the code or the symbol
export function CurrencySelect({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  value: string
  onChange: (code: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const list = currenciesWith(value)
  const selected = list.find((currency) => currency.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          'flex h-11 w-fit min-w-28 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
      >
        {selected ? currencyLabel(selected) : t('currency.placeholder')}
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-0 p-0">
        <CurrencySearch
          value={value}
          onPick={(code) => {
            onChange(code)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

// Mounted only while open, so the query and the highlighted row start fresh every time
function CurrencySearch({ value, onPick }: { value: string; onPick: (code: string) => void }) {
  const listId = useId()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const found = currenciesWith(value).filter((currency) => matchesCurrency(currency, query))

  const move = (to: number) => {
    const index = Math.max(0, Math.min(found.length - 1, to))
    setActive(index)
    document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(active + (event.key === 'ArrowDown' ? 1 : -1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const currency = found[active]
      if (currency) {
        onPick(currency.code)
      }
    }
  }

  return (
    <>
      <label className="flex items-center gap-2 border-b px-3">
        <Search className="size-4 text-muted-foreground" aria-hidden />
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={found[active] ? `${listId}-${active}` : undefined}
          aria-label={t('currency.search')}
          placeholder={t('currency.searchPlaceholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          className="h-11 w-full bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </label>
      <ul id={listId} role="listbox" aria-label={t('currency.list')} className="max-h-72 overflow-y-auto p-1">
        {found.length === 0 && <li className="px-2 py-3 text-muted-foreground">{t('currency.none')}</li>}
        {found.map((currency, index) => (
          <li
            key={currency.code}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={currency.code === value}
            onClick={() => onPick(currency.code)}
            onMouseMove={() => setActive(index)}
            className={cn(
              'flex min-h-11 cursor-default items-center gap-2 rounded-md px-2 md:min-h-9',
              index === active && 'bg-accent',
            )}
          >
            <span className="w-16 shrink-0 font-semibold">{currencyLabel(currency)}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{currency.name}</span>
            {currency.code === value && <Check className="size-4 shrink-0" aria-hidden />}
          </li>
        ))}
      </ul>
    </>
  )
}

// The browser's ISO 4217 list, which Core's own check (java.util.Currency) agrees with in practice
export interface Currency {
  code: string
  // The narrow symbol, or the code itself where the locale has no symbol of its own
  symbol: string
  name: string
}

function describe(code: string, names: Intl.DisplayNames): Currency {
  const parts = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0)
  const symbol = parts.find((part) => part.type === 'currency')?.value ?? code
  return { code, symbol, name: names.of(code) ?? code }
}

let all: Currency[] | undefined

export function currencies(): Currency[] {
  if (!all) {
    const names = new Intl.DisplayNames(undefined, { type: 'currency' })
    all = Intl.supportedValuesOf('currency')
      .map((code) => describe(code, names))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  return all
}

// A code the browser does not list (Core accepted it) is still shown rather than dropped
export function currenciesWith(code: string): Currency[] {
  const list = currencies()
  if (!code || list.some((currency) => currency.code === code)) {
    return list
  }
  return [{ code, symbol: code, name: code }, ...list]
}

// "EUR (€)", or just "CHF" where the symbol is the code itself
export const currencyLabel = (currency: Currency) =>
  currency.symbol === currency.code ? currency.code : `${currency.code} (${currency.symbol})`

export function matchesCurrency(currency: Currency, query: string): boolean {
  const q = query.trim().toLowerCase()
  return (
    !q ||
    currency.name.toLowerCase().includes(q) ||
    currency.code.toLowerCase().includes(q) ||
    currency.symbol.toLowerCase().includes(q)
  )
}

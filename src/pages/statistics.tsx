import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router'
import { Panel } from '@/components/panel'
import { CategoryBreakdown } from '@/components/category-breakdown'
import { KindToggle } from '@/components/form-header'
import { PageHeader } from '@/components/page-header'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { CategoryKind } from '@/core/api'
import { displayCurrency } from '@/core/currencies'
import { isoDate } from '@/core/dates'
import { formatMonth, formatMonthYear, formatShortMonthYear } from '@/core/format'
import { parsePeriod, periodParam, periodWindow, shiftMonth, type Period } from '@/core/periods'
import { useCurrencyTotals } from '@/hooks/use-accounts'
import { useCashflowYears } from '@/hooks/use-cashflow'
import { useWorkspace } from '@/hooks/use-workspaces'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

// Each branch's column, and the URL parameter holding the level it is drilled into
const BRANCHES: { kind: CategoryKind; param: string; title: 'statistics.expenses' | 'statistics.income' }[] =
  [
    { kind: 'EXPENSE', param: 'expense', title: 'statistics.expenses' },
    { kind: 'INCOME', param: 'income', title: 'statistics.income' },
  ]

// The category breakdown (4.11): expenses beside income from `md`, one at a time behind a switch on a phone, as
// the Categories page lays its branches out. Everything shown is in the URL — the phone's branch, period,
// currency and each column's level — so Back goes up a level and a view can be linked.
export function StatisticsPage() {
  // WorkspaceLayout renders this page only for a workspace id it has found
  const workspaceId = useParams().workspaceId!
  const workspace = useWorkspace(workspaceId)!
  const { t } = useTranslation()
  const [today] = useState(() => isoDate(new Date()))
  const [params, setParams] = useSearchParams()

  const kind: CategoryKind = params.get('kind') === 'INCOME' ? 'INCOME' : 'EXPENSE'
  const period = parsePeriod(params.get('period'), today)
  const window = periodWindow(period, today)
  const held = useCurrencyTotals(workspaceId).data?.byCurrency.map((amount) => amount.currency) ?? []
  const currency = displayCurrency(held, params.get('currency') ?? undefined, workspace.defaultCurrency)

  // Drilling is a step Back undoes; the controls replace the entry, so Back leaves the page rather than
  // replaying every tap
  const update = (changes: Record<string, string | undefined>, push = false) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: !push },
    )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('sections.statistics')}
        actions={
          // A wide screen shows both branches, so there is nothing to switch
          <div className="md:hidden">
            <KindToggle
              value={kind}
              onChange={(next) => update({ kind: next === 'INCOME' ? 'INCOME' : undefined })}
              kinds={BRANCHES.map((branch) => branch.kind)}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <PeriodPicker
          workspaceId={workspaceId}
          period={period}
          today={today}
          onPick={(next) =>
            update({
              period:
                next.kind === 'month' && next.month === today.slice(0, 7) ? undefined : periodParam(next),
            })
          }
        />
        {held.length > 1 && (
          <Chips
            label={t('statistics.currency')}
            options={held.map((code) => ({ value: code, label: code }))}
            value={currency}
            onPick={(value) => update({ currency: value })}
          />
        )}
        <p className="text-sm text-muted-foreground sm:ml-auto">{t('statistics.scope', { currency })}</p>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        {BRANCHES.map((branch) => (
          <Panel
            key={branch.kind}
            title={t(branch.title)}
            className={cn('min-w-0', branch.kind !== kind && 'hidden md:flex')}
          >
            <CategoryBreakdown
              workspaceId={workspaceId}
              kind={branch.kind}
              currency={currency}
              window={window}
              categoryId={params.get(branch.param) ?? undefined}
              onOpen={(id) => update({ [branch.param]: id }, true)}
            />
          </Panel>
        ))}
      </div>
    </div>
  )
}

const chip = (active: boolean) =>
  cn(
    'flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-bold transition-colors md:min-h-9',
    active ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground',
  )

// A row of pressed-or-not buttons on a muted track, the Charts page's preset look
function Chips({
  label,
  options,
  value,
  onPick,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onPick: (value: string) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-xl bg-muted/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onPick(option.value)}
          className={cn('flex-1', chip(option.value === value))}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const choice =
  'flex min-h-11 items-center justify-center rounded-lg text-sm font-bold transition-colors disabled:opacity-40 md:min-h-9'

// The month label's dropdown: a year stepped from the first with operations to this one, its twelve months —
// those after this one disabled — and the whole year. Portalled out of the page, so it sets the workspace's
// colour itself.
function MonthPicker({
  workspaceId,
  period,
  month,
  today,
  onPick,
  children,
}: {
  workspaceId: string
  period: Period
  // The month the label shows; this one while a year or all time is chosen
  month: string
  today: string
  onPick: (period: Period) => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(Number(month.slice(0, 4)))
  const pick = (next: Period) => {
    onPick(next)
    setOpen(false)
  }
  const wholeYear = period.kind === 'year' && period.year === String(year)
  const thisYear = Number(today.slice(0, 4))
  const firstYear = useCashflowYears(workspaceId).years?.at(-1) ?? thisYear
  const current = today.slice(0, 7)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Each opening starts on the period shown, not where the last one was left
        if (next) setYear(Number(period.kind === 'year' ? period.year : month.slice(0, 4)))
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="center" style={accentOf(workspaceId)} className="w-64 gap-2 p-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={t('statistics.previousYear')}
            disabled={year <= Math.min(firstYear, Number(month.slice(0, 4)))}
            onClick={() => setYear(year - 1)}
            className={cn(chip(false), 'px-2 disabled:opacity-40')}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <span className="text-sm font-bold">{year}</span>
          <button
            type="button"
            aria-label={t('statistics.nextYear')}
            disabled={year >= thisYear}
            onClick={() => setYear(year + 1)}
            className={cn(chip(false), 'px-2 disabled:opacity-40')}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((mm) => {
            const value = `${year}-${mm}`
            const chosen = period.kind === 'month' && value === period.month
            return (
              <button
                key={mm}
                type="button"
                aria-label={formatMonthYear(`${value}-01`)}
                aria-pressed={chosen}
                disabled={value > current}
                onClick={() => pick({ kind: 'month', month: value })}
                className={cn(choice, chosen ? 'bg-(--ws) text-white' : 'hover:bg-muted')}
              >
                {formatMonth(`${value}-01`)}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          aria-pressed={wholeYear}
          onClick={() => pick({ kind: 'year', year: String(year) })}
          className={cn(choice, 'mt-1', wholeYear ? 'bg-(--ws) text-white' : 'bg-muted/60 hover:bg-muted')}
        >
          {t('statistics.wholeYear', { year })}
        </button>
      </PopoverContent>
    </Popover>
  )
}

// ‹ November 2026 › stepping a calendar month, never past this one, the label opening a month and year dropdown;
// then this year and all time
function PeriodPicker({
  workspaceId,
  period,
  today,
  onPick,
}: {
  workspaceId: string
  period: Period
  today: string
  onPick: (period: Period) => void
}) {
  const { t } = useTranslation()
  const current = today.slice(0, 7)
  const thisYear = today.slice(0, 4)
  const month = period.kind === 'month' ? period.month : current
  // While a year is shown, every arrow steps a year; otherwise ‹ › a month and « » twelve
  const year = period.kind === 'year' ? Number(period.year) : undefined
  const step = (months: number, years: number) =>
    onPick(
      year === undefined
        ? { kind: 'month', month: shiftMonth(month, months) }
        : { kind: 'year', year: String(year + years) },
    )
  const atEnd = (months: number) =>
    year === undefined ? shiftMonth(month, months) > current : String(year) >= thisYear
  const label = year === undefined ? undefined : String(year)

  // One track on every width: on a phone the month is "Nov 2026" and takes what the rest leave, so it fits a
  // 360 px screen
  const fit = 'px-2 whitespace-nowrap sm:px-3'
  const stepper = 'flex rounded-lg px-1'
  const arrow =
    'flex min-h-11 items-center justify-center px-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 md:min-h-9'
  return (
    <div role="group" aria-label={t('statistics.period')} className="flex gap-1 rounded-xl bg-muted/60 p-1">
      {/* Each pair one stepper: a year at a time, then a month */}
      <div className={stepper}>
        <button
          type="button"
          aria-label={t('statistics.previousYear')}
          onClick={() => step(-12, -1)}
          className={arrow}
        >
          <ChevronsLeft aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t(year === undefined ? 'statistics.previousMonth' : 'statistics.previousYear')}
          onClick={() => step(-1, -1)}
          className={arrow}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
      </div>
      <MonthPicker workspaceId={workspaceId} period={period} month={month} today={today} onPick={onPick}>
        <button
          type="button"
          aria-label={t('statistics.pickMonth', { month: label ?? formatMonthYear(`${month}-01`) })}
          // A past year is shown here, pressed; this year is the chip's
          className={cn(
            chip(period.kind === 'month' || (label !== undefined && label !== thisYear)),
            fit,
            'min-w-0 flex-1 px-1 sm:min-w-36',
          )}
        >
          <span className="sm:hidden">{label ?? formatShortMonthYear(`${month}-01`)}</span>
          <span className="hidden sm:inline">{label ?? formatMonthYear(`${month}-01`)}</span>
        </button>
      </MonthPicker>
      <div className={stepper}>
        <button
          type="button"
          aria-label={t(year === undefined ? 'statistics.nextMonth' : 'statistics.nextYear')}
          disabled={atEnd(1)}
          onClick={() => step(1, 1)}
          className={arrow}
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t('statistics.nextYear')}
          disabled={atEnd(12)}
          onClick={() => step(12, 1)}
          className={arrow}
        >
          <ChevronsRight aria-hidden className="size-4" />
        </button>
      </div>
      <button
        type="button"
        aria-pressed={label === thisYear}
        onClick={() => onPick({ kind: 'year', year: thisYear })}
        className={cn(chip(label === thisYear), fit)}
      >
        {t('statistics.thisYear')}
      </button>
      <button
        type="button"
        aria-pressed={period.kind === 'all'}
        onClick={() => onPick({ kind: 'all' })}
        className={cn(chip(period.kind === 'all'), fit)}
      >
        {t('statistics.allTime')}
      </button>
    </div>
  )
}

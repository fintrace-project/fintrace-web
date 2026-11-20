import { useEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays } from '@/core/dates'
import { formatFeedDay, formatMoney, formatMonth } from '@/core/format'
import { valueOf, type HeatmapCell, type HeatmapLayout, type HeatmapMode } from '@/core/heatmap'

const CELL = 13
const PITCH = 16
const LEFT = 30
const TOP = 16
const MIN_SCALE = 0.75
// A shade per level; level 0 is the muted "nothing"
const OPACITY = [0.3, 0.5, 0.75, 1]
// Monday, Wednesday and Friday of a week that starts on a Monday, for the rows' labels
const LABELLED_ROWS: [number, string][] = [
  [0, '2024-01-01'],
  [2, '2024-01-03'],
  [4, '2024-01-05'],
]
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

// Arrow keys move a week sideways and a day up or down, as the grid lays them out
const STEPS: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }

function fillOf(cell: HeatmapCell, mode: HeatmapMode) {
  if (cell.future) return { fill: 'none' }
  if (cell.level === 0) return { fill: 'var(--muted)' }
  const colour = mode !== 'NET' ? 'var(--ws)' : cell.level > 0 ? 'var(--positive)' : 'var(--negative)'
  return { fill: colour, fillOpacity: OPACITY[Math.abs(cell.level) - 1] }
}

// The heatmap's days as an SVG grid, a column per week from Monday. One cell takes focus at a time, the selected
// one; arrows move the selection and focus with it, so the keyboard reads the grid as the eye does.
export function HeatmapGrid({
  layout,
  mode,
  currency,
  selected,
  today,
  onSelect,
}: {
  layout: HeatmapLayout
  mode: HeatmapMode
  currency: string
  selected: string | undefined
  today: string
  onSelect: (date: string) => void
}) {
  const { t } = useTranslation()
  const scroller = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const cells = useMemo(
    () => new Map(layout.weeks.flat().flatMap((cell) => (cell && !cell.future ? [[cell.date, cell]] : []))),
    [layout],
  )
  const width = LEFT + layout.weeks.length * PITCH
  const height = TOP + 7 * PITCH
  const first = layout.weeks[0]?.find(Boolean)?.date

  // Opened on the newest weeks, as GitHub's: on a phone the grid scrolls sideways and today is at its end
  useEffect(() => {
    const element = scroller.current
    if (element) element.scrollLeft = element.scrollWidth
  }, [first])

  const labelOf = (cell: HeatmapCell) => {
    const date = formatFeedDay(cell.date)
    if (cell.future) return t('heatmap.cell.future', { date })
    if (!cell.day) return t('heatmap.cell.nothing', { date })
    if (mode === 'TRANSACTIONS') return t('heatmap.cell.TRANSACTIONS', { date, count: cell.day.count })
    const value = valueOf(cell.day, mode)
    const amount = formatMoney(value, currency).replace('-', '−')
    return t(mode === 'SPENDING' ? 'heatmap.cell.SPENDING' : 'heatmap.cell.NET', { date, amount })
  }

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = STEPS[event.key]
    if (!step || !selected) return
    const next = cells.get(addDays(selected, step))
    if (!next) return
    event.preventDefault()
    onSelect(next.date)
  }

  // Focus follows the selection, once the keyboard is already in the grid
  useEffect(() => {
    if (!svg.current?.contains(document.activeElement) || !selected) return
    svg.current.querySelector<SVGRectElement>(`[data-date="${selected}"]`)?.focus()
  }, [selected])

  // The one cell reachable by Tab: the selected day, else today, else the newest day shown
  const focusable = selected ?? (cells.has(today) ? today : [...cells.keys()].at(-1))

  return (
    <div ref={scroller} className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
      <svg
        ref={svg}
        role="grid"
        aria-label={t('heatmap.label')}
        viewBox={`0 0 ${width} ${height}`}
        // A phone draws the cells at full size and scrolls; from md the grid shrinks to fit its card, cells down to
        // about 10 px, scrolling only below that
        style={
          {
            '--full': `${width}px`,
            '--fit': `${width * MIN_SCALE}px`,
            maxWidth: width * 1.25,
          } as CSSProperties
        }
        className="block h-auto w-full min-w-(--full) md:min-w-(--fit)"
        onKeyDown={onKeyDown}
      >
        {layout.months.map(({ column, date }) => (
          <text
            key={date}
            x={LEFT + column * PITCH}
            y={TOP - 5}
            className="fill-muted-foreground text-[10px]"
            aria-hidden
          >
            {formatMonth(date)}
          </text>
        ))}
        {LABELLED_ROWS.map(([row, date]) => (
          <text
            key={row}
            x={0}
            y={TOP + row * PITCH + CELL - 3}
            className="fill-muted-foreground text-[10px]"
            aria-hidden
          >
            {weekday.format(new Date(`${date}T00:00`))}
          </text>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <g key={row} role="row">
            {layout.weeks.map((week, column) => {
              const cell = week[row]
              if (!cell) return null
              const marked = cell.date === selected || cell.date === today
              return (
                <rect
                  key={cell.date}
                  role="gridcell"
                  data-date={cell.date}
                  aria-label={labelOf(cell)}
                  aria-selected={cell.date === selected}
                  aria-disabled={cell.future || undefined}
                  tabIndex={cell.date === focusable ? 0 : -1}
                  x={LEFT + column * PITCH}
                  y={TOP + row * PITCH}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  {...fillOf(cell, mode)}
                  stroke={
                    cell.date === selected
                      ? 'var(--foreground)'
                      : marked
                        ? 'var(--muted-foreground)'
                        : cell.future
                          ? 'var(--border)'
                          : 'none'
                  }
                  strokeWidth={cell.date === selected ? 2 : 1}
                  className={cell.future ? undefined : 'cursor-pointer outline-none'}
                  onClick={cell.future ? undefined : () => onSelect(cell.date)}
                >
                  <title>{labelOf(cell)}</title>
                </rect>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { BalanceChart, type BalancePoint } from '@/core/charts/balance-chart'
import { CashflowChart, ExpenseChart, type CashflowPoint } from '@/core/charts/cashflow-chart'
import {
  TimeChart,
  type ChartColours,
  type ChartEngine,
  type TimeChartOptions,
} from '@/core/charts/time-chart'
import type { DateWindow } from '@/core/charts/windows'
import { cn } from '@/lib/utils'

type ChartType<P> = new (engine: ChartEngine, element: HTMLElement, options: TimeChartOptions) => TimeChart<P>

interface ChartViewProps {
  group: string
  currency: string
  window: DateWindow
  onWindow: (window: DateWindow) => void
  compact?: boolean
  slider?: boolean
  className?: string
}

// The design tokens as the element resolves them: the workspace's accent, muted text, hairlines, the money
// colours. Painted on a 1×1 canvas and read back as rgba, since ECharts parses no oklch() and the dark theme's
// tokens are oklch.
function coloursOf(element: HTMLElement): ChartColours {
  const style = getComputedStyle(element)
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const token = (name: string) => {
    const value = style.getPropertyValue(name).trim()
    if (!context) return value
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
    return `rgba(${r}, ${g}, ${b}, ${(a! / 255).toFixed(3)})`
  }
  return {
    line: token('--ws'),
    text: token('--muted-foreground'),
    grid: token('--border'),
    positive: token('--positive'),
    negative: token('--negative'),
  }
}

// Mounts one currency's chart of either kind; the page above owns its data, its bounds and its window
function TimeChartView<P>({
  type,
  data,
  bounds,
  group,
  currency,
  window,
  onWindow,
  compact = false,
  slider = true,
  className,
}: ChartViewProps & { type: ChartType<P>; data: P[]; bounds: DateWindow }) {
  const element = useRef<HTMLDivElement>(null)
  const [chart, setChart] = useState<TimeChart<P>>()
  const handlers = useRef({ onWindow })

  useEffect(() => {
    handlers.current = { onWindow }
  }, [onWindow])

  useEffect(() => {
    const host = element.current
    if (!host) return
    let disposed = false
    let created: TimeChart<P> | undefined
    void TimeChart.load().then((engine) => {
      if (disposed) return
      created = new type(engine, host, {
        group,
        currency,
        colours: coloursOf(host),
        onWindow: (next) => handlers.current.onWindow(next),
        compact,
        slider,
      })
      setChart(created)
    })
    return () => {
      disposed = true
      created?.dispose()
      setChart(undefined)
    }
  }, [type, group, currency, compact, slider])

  useEffect(() => {
    chart?.setData(data, { from: bounds.from, to: bounds.to })
  }, [chart, data, bounds.from, bounds.to])

  useEffect(() => {
    chart?.setWindow({ from: window.from, to: window.to })
  }, [chart, window.from, window.to])

  // touch-pan-y: the browser takes only vertical scrolling here, so a sideways drag reaches the slider and pinch
  // the chart, never the browser's swipe-back
  return <div ref={element} className={cn('h-56 w-full touch-pan-y', className)} />
}

// Without bounds of its own, the line spans its first and last points
export function BalanceChartView({
  points,
  bounds,
  ...props
}: ChartViewProps & { points: BalancePoint[]; bounds?: DateWindow }) {
  const first = points[0]?.[0] ?? ''
  const last = points[points.length - 1]?.[0] ?? ''
  const span = useMemo(() => bounds ?? { from: first, to: last }, [bounds, first, last])
  return <TimeChartView type={BalanceChart} data={points} bounds={span} {...props} />
}

export function CashflowChartView({
  points,
  bounds,
  ...props
}: ChartViewProps & { points: CashflowPoint[]; bounds: DateWindow }) {
  return <TimeChartView type={CashflowChart} data={points} bounds={bounds} {...props} />
}

export function ExpenseChartView({
  points,
  bounds,
  ...props
}: ChartViewProps & { points: CashflowPoint[]; bounds: DateWindow }) {
  return <TimeChartView type={ExpenseChart} data={points} bounds={bounds} {...props} />
}

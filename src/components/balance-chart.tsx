import { useEffect, useRef, useState } from 'react'
import { BalanceChart, type ChartColours } from '@/core/charts/balance-chart'
import type { DateWindow } from '@/core/charts/windows'
import { cn } from '@/lib/utils'

export interface BalanceChartViewProps {
  group: string
  currency: string
  points: [string, number][]
  window: DateWindow
  onWindow: (window: DateWindow) => void
  compact?: boolean
  className?: string
}

// The design tokens as the element resolves them: the workspace's accent, muted text, hairlines. Painted on a
// 1×1 canvas and read back as rgba, since ECharts parses no oklch() and the dark theme's tokens are oklch.
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
  return { line: token('--ws'), text: token('--muted-foreground'), grid: token('--border') }
}

// Mounts one currency's chart; the page above owns its data and its window
export function BalanceChartView({
  group,
  currency,
  points,
  window,
  onWindow,
  compact = false,
  className,
}: BalanceChartViewProps) {
  const element = useRef<HTMLDivElement>(null)
  const [chart, setChart] = useState<BalanceChart>()
  const handlers = useRef({ onWindow })

  useEffect(() => {
    handlers.current = { onWindow }
  }, [onWindow])

  useEffect(() => {
    const host = element.current
    if (!host) return
    let disposed = false
    let created: BalanceChart | undefined
    void BalanceChart.load().then((engine) => {
      if (disposed) return
      created = new BalanceChart(engine, host, {
        group,
        currency,
        colours: coloursOf(host),
        onWindow: (next) => handlers.current.onWindow(next),
        compact,
      })
      setChart(created)
    })
    return () => {
      disposed = true
      created?.dispose()
      setChart(undefined)
    }
  }, [group, currency, compact])

  useEffect(() => {
    chart?.setLine(points)
  }, [chart, points])

  useEffect(() => {
    chart?.setWindow({ from: window.from, to: window.to })
  }, [chart, window.from, window.to])

  // touch-pan-y: the browser takes only vertical scrolling here, so a sideways drag reaches the slider and pinch
  // the chart, never the browser's swipe-back
  return <div ref={element} className={cn('h-56 w-full touch-pan-y', className)} />
}

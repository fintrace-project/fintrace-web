import { useEffect, useRef, useState } from 'react'
import { DonutChart, type DonutSlice } from '@/core/charts/donut-chart'

// Mounts a breakdown level's donut once ECharts has loaded, as the time charts do; the rows under it carry the
// same figures for a screen reader, so the canvas is hidden from one
export function DonutChartView({ slices, currency }: { slices: DonutSlice[]; currency: string }) {
  const element = useRef<HTMLDivElement>(null)
  const [chart, setChart] = useState<DonutChart>()

  useEffect(() => {
    const host = element.current
    if (!host) return
    let disposed = false
    let created: DonutChart | undefined
    void DonutChart.load().then((engine) => {
      if (disposed) return
      created = new DonutChart(engine, host, currency)
      setChart(created)
    })
    return () => {
      disposed = true
      created?.dispose()
      setChart(undefined)
    }
  }, [currency])

  useEffect(() => {
    chart?.setData(slices)
  }, [chart, slices])

  // touch-pan-y: one finger over the ring still scrolls the page
  return <div ref={element} aria-hidden className="mx-auto size-56 touch-pan-y" />
}

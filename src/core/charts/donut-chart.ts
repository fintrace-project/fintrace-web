import type { ECharts } from './echarts'
import { formatMoney } from '@/core/format'
import type { ChartEngine } from './time-chart'

export interface DonutSlice {
  key: string
  name: string
  // Core's total for the slice; ECharts sizes the arcs from them, the client sums nothing
  value: number
  colour: string
}

// A ring of a breakdown level's slices, largest first as the rows; a tooltip names a slice and its figure
export class DonutChart {
  private readonly chart: ECharts
  // A column hidden on a phone starts at no size; it is drawn when the switch shows it
  private readonly resize: ResizeObserver

  static load(): Promise<ChartEngine> {
    return import('./echarts')
  }

  private readonly currency: string

  constructor(echarts: ChartEngine, element: HTMLElement, currency: string) {
    this.currency = currency
    this.chart = echarts.init(element)
    this.resize = new ResizeObserver(() => this.chart.resize())
    this.resize.observe(element)
  }

  setData(slices: DonutSlice[]) {
    this.chart.setOption({
      tooltip: {
        trigger: 'item',
        valueFormatter: (value: number) => formatMoney(value, this.currency),
      },
      series: [
        {
          type: 'pie',
          radius: ['62%', '92%'],
          padAngle: slices.length > 1 ? 1.5 : 0,
          itemStyle: { borderRadius: 4 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scale: false },
          data: slices.map((slice) => ({
            id: slice.key,
            name: slice.name,
            value: slice.value,
            itemStyle: { color: slice.colour },
          })),
        },
      ],
    })
  }

  dispose() {
    this.resize.disconnect()
    this.chart.dispose()
  }
}

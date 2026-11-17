import { formatMoney } from '@/core/format'
import { TimeChart, ts, type ChartBody } from './time-chart'

// A point is a bucket's end and the balance Core computed for it
export type BalancePoint = [string, number]

// One currency's balance as a step line
export class BalanceChart extends TimeChart<BalancePoint> {
  protected body(points: BalancePoint[]): ChartBody {
    const { currency, colours } = this.options
    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number) => formatMoney(value, currency).replace('-', '−'),
      },
      yAxis: this.valueAxis({ scale: true }),
      series: [
        {
          type: 'line',
          name: currency,
          data: points.map(([date, value]) => [ts(date), value]),
          showSymbol: false,
          step: 'end',
          lineStyle: { width: 2, color: colours.line },
          itemStyle: { color: colours.line },
          areaStyle: { color: colours.line, opacity: 0.12 },
        },
      ],
    }
  }
}

import { addDays, localDate } from '@/core/dates'
import { formatCount, formatMoney, formatShortDate, formatSignedMagnitude } from '@/core/format'
import { t } from '@/core/i18n'
import { TimeChart, ts, type ChartBody } from './time-chart'

// One bucket of one currency, its figures as Core sent them: income and expense magnitudes, net signed
export interface CashflowPoint {
  start: string
  // The bucket's last day
  last: string
  income: number
  expense: number
  net: number
  count: number
}

// A bar stands in the middle of its bucket, so a month's spans the month on the shared time axis
const middle = ({ start, last }: CashflowPoint) => (ts(start) + localDate(addDays(last, 1)).getTime()) / 2

// One currency's income as bars up and its expense as bars down, a pair per bucket
export class CashflowChart extends TimeChart<CashflowPoint> {
  protected body(points: CashflowPoint[]): ChartBody {
    const { colours } = this.options
    const bar = { type: 'bar', stack: 'flow', barMaxWidth: 28 }
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (items: { dataIndex: number }[]) => {
          const point = points[items[0]?.dataIndex ?? -1]
          return point ? this.tooltipOf(point) : ''
        },
      },
      yAxis: this.valueAxis(),
      series: [
        {
          ...bar,
          name: t('charts.cashflow.income'),
          data: points.map((point) => [middle(point), point.income]),
          itemStyle: { color: colours.positive },
        },
        {
          ...bar,
          name: t('charts.cashflow.expense'),
          // Below the axis only where it is drawn: the tooltip shows Core's magnitude, nothing is computed from it
          data: points.map((point) => [middle(point), -point.expense]),
          itemStyle: { color: colours.negative },
        },
      ],
    }
  }

  private tooltipOf(point: CashflowPoint) {
    const { currency } = this.options
    return [
      periodOf(point),
      row(t('charts.cashflow.income'), formatSignedMagnitude(point.income, currency, true)),
      row(t('charts.cashflow.expense'), formatSignedMagnitude(point.expense, currency, false)),
      row(t('charts.cashflow.net'), formatMoney(point.net, currency).replace('-', '−')),
      row(t('charts.cashflow.operations'), formatCount(point.count)),
    ].join('')
  }
}

// The overview's glance: one currency's expense alone, a bar rising per bucket, in the expense colour
export class ExpenseChart extends TimeChart<CashflowPoint> {
  protected body(points: CashflowPoint[]): ChartBody {
    const { currency, colours } = this.options
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (items: { dataIndex: number }[]) => {
          const point = points[items[0]?.dataIndex ?? -1]
          if (!point) return ''
          return periodOf(point) + row(t('charts.cashflow.expense'), formatMoney(point.expense, currency))
        },
      },
      yAxis: this.valueAxis(),
      series: [
        {
          type: 'bar',
          barMaxWidth: 20,
          name: t('charts.cashflow.expense'),
          data: points.map((point) => [middle(point), point.expense]),
          itemStyle: { color: colours.negative, borderRadius: [3, 3, 0, 0] },
        },
      ],
    }
  }
}

function periodOf({ start, last }: CashflowPoint) {
  const period =
    start === last ? formatShortDate(start) : `${formatShortDate(start)} – ${formatShortDate(last)}`
  return `<div style="margin-bottom:4px">${period}</div>`
}

const row = (label: string, value: string) =>
  `<div style="display:flex;justify-content:space-between;gap:16px"><span>${label}</span>` +
  `<span style="font-variant-numeric:tabular-nums">${value}</span></div>`

import { isoDate, localDate } from '@/core/dates'
import { formatCompact, formatShortDate } from '@/core/format'
import type { ECharts } from './echarts'
import {
  MouseInteraction,
  TouchInteraction,
  type ChartInteraction,
  type InteractionHost,
} from './interactions'
import type { DateWindow } from './windows'

// Read by the page from the design tokens, so the chart follows the workspace's accent and the theme
export interface ChartColours {
  line: string
  text: string
  grid: string
  positive: string
  negative: string
}

export interface TimeChartOptions {
  // Charts sharing a group zoom and brush together: one per currency, one window for all
  group: string
  currency: string
  colours: ChartColours
  onWindow: (window: DateWindow) => void
  // A glance in a panel: the figures and their tooltip, nothing to zoom or select, so no gesture is taken at all
  compact?: boolean
  // Off for a chart whose card carries another chart with one: one slider per card
  slider?: boolean
}

const NO_INTERACTION: ChartInteraction = { afterRedraw() {}, dispose() {} }

export type ChartEngine = typeof import('./echarts')

export const ts = (iso: string) => localDate(iso).getTime()

// What a kind of chart adds to the shared frame: its series, its value axis and its tooltip
export interface ChartBody {
  series: object[]
  yAxis: object
  tooltip: object
}

// Owns one ECharts instance drawing one currency over time. The page owns the data and the window; the chart
// draws them and reports, debounced, the window a zoom or a selection leaves, so the page can fetch for it.
// Every chart in a group is given the same bounds, so the percentages ECharts' connect passes between them
// stand for the same dates on a line and on bars.
export abstract class TimeChart<P> {
  protected readonly options: TimeChartOptions
  private readonly element: HTMLElement
  private readonly chart: ECharts
  private readonly resize: ResizeObserver
  // A touch screen or a mouse, re-read whenever it changes: a laptop's touchscreen, a tablet's keyboard
  private readonly coarse = matchMedia('(pointer: coarse)')
  private interaction: ChartInteraction
  private extent: [number, number] = [0, 0]
  private window: DateWindow | undefined
  private zoomTimer: ReturnType<typeof setTimeout> | undefined

  // ECharts arrives by import(), as its own chunk with its own budget (§3.6). Loaded apart from creating the
  // chart, so a caller unmounted meanwhile creates nothing: init() on an element that already holds a chart
  // hands back that chart, and disposing a late one would dispose the live one with it.
  static load(): Promise<ChartEngine> {
    return import('./echarts')
  }

  constructor(echarts: ChartEngine, element: HTMLElement, options: TimeChartOptions) {
    this.options = options
    this.element = element
    this.chart = echarts.init(element)
    this.chart.group = options.group
    echarts.connect(options.group)
    this.resize = new ResizeObserver(() => this.chart.resize())
    this.resize.observe(element)
    this.chart.on('datazoom', () => this.onZoom())
    this.interaction = this.interactionFor()
    this.coarse.addEventListener('change', this.onPointerChange)
  }

  setData(points: P[], bounds: DateWindow) {
    this.extent = [ts(bounds.from), ts(bounds.to)]
    this.chart.setOption(this.option(points), { notMerge: true })
    this.interaction.afterRedraw()
    if (this.window) this.zoomTo(this.window)
  }

  setWindow(window: DateWindow) {
    if (this.window?.from === window.from && this.window.to === window.to) return
    this.window = window
    this.zoomTo(window)
  }

  dispose() {
    clearTimeout(this.zoomTimer)
    this.resize.disconnect()
    this.coarse.removeEventListener('change', this.onPointerChange)
    this.interaction.dispose()
    this.chart.dispose()
  }

  protected abstract body(points: P[]): ChartBody

  protected axisLabel() {
    return { color: this.options.colours.text, ...(this.options.compact ? { fontSize: 10 } : {}) }
  }

  // Compact and without the currency, which the card's title names; the tooltip carries the full figure
  protected valueAxis(extra: object = {}) {
    return {
      type: 'value',
      splitLine: { lineStyle: { color: this.options.colours.grid } },
      axisLabel: { ...this.axisLabel(), formatter: formatCompact },
      ...extra,
    }
  }

  private interactionFor(): ChartInteraction {
    const host: InteractionHost = {
      chart: this.chart,
      element: this.element,
      select: (from, to) => this.select(from, to),
    }
    if (this.options.compact) return NO_INTERACTION
    return this.coarse.matches ? new TouchInteraction(host) : new MouseInteraction(host)
  }

  private readonly onPointerChange = () => {
    this.interaction.dispose()
    this.interaction = this.interactionFor()
    this.interaction.afterRedraw()
  }

  // A range of under a day is a tap, not a selection
  private select(from: number, to: number) {
    if (to - from < 86_400_000) return
    this.options.onWindow({ from: isoDate(new Date(from)), to: isoDate(new Date(to)) })
  }

  private zoomTo(window: DateWindow) {
    this.chart.dispatchAction({ type: 'dataZoom', startValue: ts(window.from), endValue: ts(window.to) })
  }

  private onZoom() {
    const zoom = (this.chart.getOption() as { dataZoom?: { start?: number; end?: number }[] }).dataZoom?.[0]
    if (zoom?.start === undefined || zoom.end === undefined) return
    const [first, last] = this.extent
    const at = (pct: number) => isoDate(new Date(first + ((last - first) * pct) / 100))
    const window = { from: at(zoom.start), to: at(zoom.end) }
    this.window = window
    clearTimeout(this.zoomTimer)
    this.zoomTimer = setTimeout(() => this.options.onWindow(window), 250)
  }

  private option(points: P[]) {
    const { compact } = this.options
    const slider = !compact && this.options.slider !== false
    const [min, max] = this.extent
    const body = this.body(points)
    return {
      animation: false,
      grid: {
        left: 4,
        right: compact ? 4 : 12,
        top: compact ? 8 : 12,
        bottom: slider ? 40 : 4,
        containLabel: true,
      },
      // Labels that would collide are dropped rather than run together on a narrow screen
      xAxis: {
        type: 'time',
        min,
        max,
        axisLabel: { ...this.axisLabel(), hideOverlap: true },
        splitLine: { show: false },
      },
      toolbox: { show: false, feature: { brush: { type: ['lineX'] } } },
      brush: {
        xAxisIndex: 0,
        brushType: 'lineX',
        brushMode: 'single',
        throttleType: 'debounce',
        throttleDelay: 300,
      },
      dataZoom: compact
        ? []
        : [
            {
              type: 'inside',
              xAxisIndex: 0,
              filterMode: 'none',
              // A drag selects a range rather than panning; pinch and Ctrl+wheel zoom
              moveOnMouseMove: false,
              preventDefaultMouseMove: false,
              zoomOnMouseWheel: 'ctrl',
              moveOnMouseWheel: false,
            },
            // Under every card, beside the one being read; connected, any of them moves all
            ...(slider
              ? [
                  {
                    type: 'slider',
                    xAxisIndex: 0,
                    filterMode: 'none',
                    height: 18,
                    bottom: 4,
                    labelFormatter: '',
                  },
                ]
              : []),
          ],
      ...body,
      tooltip: {
        axisPointer: {
          label: { formatter: (p: { value: number }) => formatShortDate(isoDate(new Date(p.value))) },
        },
        ...body.tooltip,
      },
    }
  }
}

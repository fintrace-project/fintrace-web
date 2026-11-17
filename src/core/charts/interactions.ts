import type { ECharts } from './echarts'

// What an interaction needs from the chart it is installed on
export interface InteractionHost {
  chart: ECharts
  element: HTMLElement
  // A range picked on the x axis, as times; the chart turns it into a window
  select(from: number, to: number): void
}

// How a pointer picks a range and zooms. One is installed per chart at a time, chosen by the pointer type and
// swapped when it changes, so a mouse's handling can never disturb a finger's, nor the other way round.
export interface ChartInteraction {
  // ECharts drops some of its state on every redraw (setOption with notMerge); taken again here
  afterRedraw(): void
  dispose(): void
}

const clearSelection = (chart: ECharts) => chart.dispatchAction({ type: 'brush', areas: [] })

// Two pixels on the x axis as the times they stand for, earliest first
function times(chart: ECharts, a: number, b: number): [number, number] {
  const at = (px: number) => Number(chart.convertFromPixel({ xAxisIndex: 0 }, px))
  return [at(Math.min(a, b)), at(Math.max(a, b))]
}

const WHEEL_EVENTS = ['wheel', 'mousewheel'] as const

// A drag across the chart always selects a range (§11.3, Kibana-style), through ECharts' brush. A plain wheel
// scrolls the page: ECharts' zoom cancels every wheel over the plot before asking whether to zoom, so one
// without Ctrl is kept from reaching it, and Ctrl+wheel (a trackpad's pinch) still zooms.
export class MouseInteraction implements ChartInteraction {
  private readonly host: InteractionHost

  constructor(host: InteractionHost) {
    this.host = host
    WHEEL_EVENTS.forEach((type) => host.element.addEventListener(type, this.wheelGuard, { capture: true }))
    host.chart.on('brushEnd', this.onBrushEnd)
  }

  afterRedraw() {
    this.cursor('lineX')
  }

  dispose() {
    WHEEL_EVENTS.forEach((type) =>
      this.host.element.removeEventListener(type, this.wheelGuard, { capture: true }),
    )
    this.host.chart.off('brushEnd', this.onBrushEnd)
    this.cursor(false)
    clearSelection(this.host.chart)
  }

  private cursor(brushType: 'lineX' | false) {
    this.host.chart.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType, brushMode: 'single' },
    })
  }

  private readonly wheelGuard = (event: Event) => {
    if (!(event as WheelEvent).ctrlKey) event.stopPropagation()
  }

  private readonly onBrushEnd = (event: unknown) => {
    const range = (event as { areas: { coordRange: [number, number] }[] }).areas[0]?.coordRange
    clearSelection(this.host.chart)
    if (range) this.host.select(range[0], range[1])
  }
}

const TOUCH_EVENTS = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const

// Touch selects by itself, never through ECharts' brush: a live brush holds the pan lock that pinch needs, and
// it cancels the touch the page scrolls with (§3.6). One finger: a sideways drag over the plot selects, a
// vertical one is the browser's scroll (touch-action: pan-y on the element); two fingers are ECharts' pinch; the
// slider is its own. Passive listeners, so no touch is ever cancelled.
export class TouchInteraction implements ChartInteraction {
  private readonly host: InteractionHost
  private touch: { from: number; to: number; y: number; selecting: boolean } | undefined

  constructor(host: InteractionHost) {
    this.host = host
    TOUCH_EVENTS.forEach((type) => host.element.addEventListener(type, this.onTouch, { passive: true }))
  }

  afterRedraw() {}

  dispose() {
    TOUCH_EVENTS.forEach((type) => this.host.element.removeEventListener(type, this.onTouch))
    this.touch = undefined
    clearSelection(this.host.chart)
  }

  private readonly onTouch = (event: TouchEvent) => {
    const { chart, element } = this.host
    const finger = event.touches[0] ?? event.changedTouches[0]
    if (!finger) return
    const box = element.getBoundingClientRect()
    const x = finger.clientX - box.left
    const y = finger.clientY - box.top

    if (event.type === 'touchstart') {
      const onPlot = chart.containPixel({ gridIndex: 0 }, [x, y])
      this.touch = event.touches.length === 1 && onPlot ? { from: x, to: x, y, selecting: false } : undefined
      if (!this.touch) clearSelection(chart)
      return
    }
    const touch = this.touch
    if (!touch) return
    if (event.type === 'touchcancel' || (event.type === 'touchmove' && event.touches.length !== 1)) {
      this.touch = undefined
      clearSelection(chart)
      return
    }
    if (event.type === 'touchmove') {
      const dx = Math.abs(x - touch.from)
      const dy = Math.abs(y - touch.y)
      if (!touch.selecting) {
        if (dx < 8 && dy < 8) return
        if (dy >= dx) {
          this.touch = undefined
          return
        }
        touch.selecting = true
      }
      touch.to = x
      chart.dispatchAction({
        type: 'brush',
        areas: [{ brushType: 'lineX', xAxisIndex: 0, coordRange: times(chart, touch.from, touch.to) }],
      })
      return
    }
    this.touch = undefined
    clearSelection(chart)
    if (touch.selecting) this.host.select(...times(chart, touch.from, touch.to))
  }
}

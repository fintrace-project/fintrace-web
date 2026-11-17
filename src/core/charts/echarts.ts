// The one module that imports ECharts, and only by a dynamic import(), so it stays its own chunk with its own
// budget and never reaches the first load (§3.6). Registers just what the balance and cashflow charts draw with.
import { BarChart, LineChart } from 'echarts/charts'
import {
  BrushComponent,
  DataZoomComponent,
  GridComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components'
import { connect, init, use as register } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

register([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  CanvasRenderer,
])

export { connect, init }
export type { ECharts } from 'echarts/core'

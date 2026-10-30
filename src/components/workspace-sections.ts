import { ChartLine, ChartPie, LayoutDashboard, List, Wallet, type LucideIcon } from 'lucide-react'

export interface Section {
  to: string
  // Its name, under sections in en.yml
  key: 'overview' | 'accounts' | 'operations' | 'statistics' | 'charts'
  icon: LucideIcon
}

export const workspaceSections = (workspaceId: string): Section[] => [
  { to: `/w/${workspaceId}`, key: 'overview', icon: LayoutDashboard },
  { to: `/w/${workspaceId}/accounts`, key: 'accounts', icon: Wallet },
  { to: `/w/${workspaceId}/operations`, key: 'operations', icon: List },
  { to: `/w/${workspaceId}/statistics`, key: 'statistics', icon: ChartPie },
  { to: `/w/${workspaceId}/charts`, key: 'charts', icon: ChartLine },
]

export const workspaceSettings = (workspaceId: string) => `/w/${workspaceId}/settings`

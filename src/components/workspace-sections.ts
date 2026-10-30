import { ChartLine, ChartPie, LayoutDashboard, List, Wallet, type LucideIcon } from 'lucide-react'

export interface Section {
  to: string
  label: string
  icon: LucideIcon
}

export const workspaceSections = (workspaceId: string): Section[] => [
  { to: `/w/${workspaceId}`, label: 'Overview', icon: LayoutDashboard },
  { to: `/w/${workspaceId}/accounts`, label: 'Accounts', icon: Wallet },
  { to: `/w/${workspaceId}/operations`, label: 'Operations', icon: List },
  { to: `/w/${workspaceId}/statistics`, label: 'Statistics', icon: ChartPie },
  { to: `/w/${workspaceId}/charts`, label: 'Charts', icon: ChartLine },
]

export const workspaceSettings = (workspaceId: string) => `/w/${workspaceId}/settings`

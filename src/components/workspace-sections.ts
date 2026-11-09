import { ChartLine, ChartPie, LayoutDashboard, List, Tags, Wallet, type LucideIcon } from 'lucide-react'

export interface Section {
  to: string
  // Its name, under sections in en.yml
  key: 'overview' | 'accounts' | 'categories' | 'operations' | 'statistics' | 'charts'
  icon: LucideIcon
  // In the tab bar only: from `md` up the overview holds the feed itself
  phoneOnly?: true
  // In the sidebar only: the tab bar is full, and a phone reaches it from the workspace's settings
  desktopOnly?: true
}

export const workspaceCategories = (workspaceId: string) => `/w/${workspaceId}/categories`

export const workspaceSections = (workspaceId: string): Section[] => [
  { to: `/w/${workspaceId}`, key: 'overview', icon: LayoutDashboard },
  { to: `/w/${workspaceId}/operations`, key: 'operations', icon: List, phoneOnly: true },
  { to: `/w/${workspaceId}/accounts`, key: 'accounts', icon: Wallet },
  { to: workspaceCategories(workspaceId), key: 'categories', icon: Tags, desktopOnly: true },
  { to: `/w/${workspaceId}/statistics`, key: 'statistics', icon: ChartPie },
  { to: `/w/${workspaceId}/charts`, key: 'charts', icon: ChartLine },
]

export const workspaceSettings = (workspaceId: string) => `/w/${workspaceId}/settings`

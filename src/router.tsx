import { createBrowserRouter, redirect } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { WorkspaceLayout } from '@/components/workspace-layout'
import { AccountsPage } from '@/pages/accounts'
import { ChartsPage } from '@/pages/charts'
import { HomePage } from '@/pages/home'
import { NotFoundPage } from '@/pages/not-found'
import { OperationsPage } from '@/pages/operations'
import { OverviewPage } from '@/pages/overview'
import { StatisticsPage } from '@/pages/statistics'
import { WorkspaceNewPage } from '@/pages/workspace-new'
import { WorkspaceSettingsPage } from '@/pages/workspace-settings'
import { WorkspacesPage } from '@/pages/workspaces'

export const router = createBrowserRouter([
  { path: '/welcome', Component: HomePage },
  {
    path: '/',
    Component: AppShell,
    children: [
      // Sign-in returns to `/` (the BFF's callback), so this is where every session starts
      { index: true, loader: () => redirect('/workspaces') },
      { path: 'workspaces', Component: WorkspacesPage },
      { path: 'workspaces/new', Component: WorkspaceNewPage },
      {
        path: 'w/:workspaceId',
        Component: WorkspaceLayout,
        children: [
          { index: true, Component: OverviewPage },
          { path: 'accounts', Component: AccountsPage },
          { path: 'operations', Component: OperationsPage },
          { path: 'statistics', Component: StatisticsPage },
          { path: 'charts', Component: ChartsPage },
          { path: 'settings', Component: WorkspaceSettingsPage },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])

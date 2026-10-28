import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { NotFoundPage } from '@/pages/not-found'
import { OperationsPage } from '@/pages/operations'
import { OverviewPage } from '@/pages/overview'
import { WorkspacesPage } from '@/pages/workspaces'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: OverviewPage },
      { path: 'operations', Component: OperationsPage },
      { path: 'workspaces', Component: WorkspacesPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])

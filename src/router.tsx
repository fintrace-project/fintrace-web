import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { WorkspaceLayout } from '@/components/workspace-layout'
import { HomePage } from '@/pages/home'
import { NotFoundPage } from '@/pages/not-found'
import { OperationsPage } from '@/pages/operations'
import { OverviewPage } from '@/pages/overview'
import { StartPage } from '@/pages/start'
import { WorkspaceNewPage } from '@/pages/workspace-new'

export const router = createBrowserRouter([
  { path: '/welcome', Component: HomePage },
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: StartPage },
      { path: 'workspaces/new', Component: WorkspaceNewPage },
      {
        path: 'w/:workspaceId',
        Component: WorkspaceLayout,
        children: [
          { index: true, Component: OverviewPage },
          { path: 'operations', Component: OperationsPage },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])

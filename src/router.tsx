import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { NotFoundPage } from '@/pages/not-found'
import { OperationsPage } from '@/pages/operations'
import { OverviewPage } from '@/pages/overview'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    children: [
      { index: true, Component: OverviewPage },
      { path: 'operations', Component: OperationsPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])

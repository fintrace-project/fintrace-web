import { createBrowserRouter, Navigate, redirect, type LoaderFunctionArgs } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { WorkspaceLayout } from '@/components/workspace-layout'
import { getSession, UnauthorizedError } from '@/core/api'
import { AccountsPage } from '@/pages/accounts'
import { ChartsPage } from '@/pages/charts'
import { HomePage } from '@/pages/home'
import { NotFoundPage } from '@/pages/not-found'
import { OperationsPage } from '@/pages/operations'
import { OverviewPage } from '@/pages/overview'
import { PreferencesPage } from '@/pages/preferences'
import { RouteErrorPage } from '@/pages/route-error'
import { StatisticsPage } from '@/pages/statistics'
import { WorkspaceImportPage } from '@/pages/workspace-import'
import { WorkspaceNewPage } from '@/pages/workspace-new'
import { WorkspaceSettingsPage } from '@/pages/workspace-settings'
import { WorkspacesPage } from '@/pages/workspaces'

// Asked once on entry, outside TanStack Query, so a 401 here routes to the welcome page rather than
// through the QueryCache's redirect to sign-in
async function signedIn({ request }: LoaderFunctionArgs) {
  try {
    await getSession(request.signal)
    return true
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return false
    }
    throw error
  }
}

// Nothing to show while the entry check is in flight; an empty element rather than null, which the
// router reads as no fallback and warns about
const blank = <></>

export const router = createBrowserRouter([
  {
    path: '/welcome',
    Component: HomePage,
    ErrorBoundary: RouteErrorPage,
    hydrateFallbackElement: blank,
    loader: async (args) => ((await signedIn(args)) ? redirect('/workspaces') : null),
  },
  {
    path: '/',
    Component: AppShell,
    ErrorBoundary: RouteErrorPage,
    hydrateFallbackElement: blank,
    loader: async (args) => ((await signedIn(args)) ? null : redirect('/welcome')),
    // Once per entry: a session lapsing later is caught by the next read's 401
    shouldRevalidate: () => false,
    children: [
      // Sign-in returns to `/` (the BFF's callback), so this is where every session starts. Rendered
      // rather than a loader: the deepest loader's redirect wins, and it would overtake the shell's.
      { index: true, element: <Navigate to="/workspaces" replace /> },
      { path: 'workspaces', Component: WorkspacesPage },
      { path: 'workspaces/new', Component: WorkspaceNewPage },
      { path: 'preferences', Component: PreferencesPage },
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
          { path: 'import', Component: WorkspaceImportPage },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])

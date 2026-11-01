import { createBrowserRouter, Navigate, redirect, type LoaderFunctionArgs } from 'react-router'
import { getSession, UnauthorizedError } from '@/core/api'
import { NotFoundPage } from '@/pages/not-found'
import { RouteErrorPage } from '@/pages/route-error'

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

// Each page, the shell and the workspace layout are chunks of their own, fetched on first visit
// alongside the route's loader, so the welcome page never loads the shell. Only the error pages stay
// in the first load: an error page must not need a chunk.
export const router = createBrowserRouter([
  {
    path: '/welcome',
    lazy: { Component: () => import('@/pages/home').then((m) => m.HomePage) },
    ErrorBoundary: RouteErrorPage,
    hydrateFallbackElement: blank,
    loader: async (args) => ((await signedIn(args)) ? redirect('/workspaces') : null),
  },
  {
    path: '/',
    lazy: { Component: () => import('@/components/app-shell').then((m) => m.AppShell) },
    ErrorBoundary: RouteErrorPage,
    hydrateFallbackElement: blank,
    loader: async (args) => ((await signedIn(args)) ? null : redirect('/welcome')),
    // Once per entry: a session lapsing later is caught by the next read's 401
    shouldRevalidate: () => false,
    children: [
      // Sign-in returns to `/` (the BFF's callback), so this is where every session starts. Rendered
      // rather than a loader: the deepest loader's redirect wins, and it would overtake the shell's.
      { index: true, element: <Navigate to="/workspaces" replace /> },
      {
        path: 'workspaces',
        lazy: { Component: () => import('@/pages/workspaces').then((m) => m.WorkspacesPage) },
      },
      {
        path: 'workspaces/new',
        lazy: { Component: () => import('@/pages/workspace-new').then((m) => m.WorkspaceNewPage) },
      },
      {
        path: 'preferences',
        lazy: { Component: () => import('@/pages/preferences').then((m) => m.PreferencesPage) },
      },
      {
        path: 'w/:workspaceId',
        lazy: {
          Component: () => import('@/components/workspace-layout').then((m) => m.WorkspaceLayout),
        },
        children: [
          {
            index: true,
            lazy: { Component: () => import('@/pages/overview').then((m) => m.OverviewPage) },
          },
          {
            path: 'accounts',
            lazy: { Component: () => import('@/pages/accounts').then((m) => m.AccountsPage) },
          },
          {
            path: 'operations',
            lazy: { Component: () => import('@/pages/operations').then((m) => m.OperationsPage) },
          },
          {
            path: 'statistics',
            lazy: { Component: () => import('@/pages/statistics').then((m) => m.StatisticsPage) },
          },
          {
            path: 'charts',
            lazy: { Component: () => import('@/pages/charts').then((m) => m.ChartsPage) },
          },
          {
            path: 'settings',
            lazy: {
              Component: () => import('@/pages/workspace-settings').then((m) => m.WorkspaceSettingsPage),
            },
          },
          {
            path: 'import',
            lazy: {
              Component: () => import('@/pages/workspace-import').then((m) => m.WorkspaceImportPage),
            },
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])

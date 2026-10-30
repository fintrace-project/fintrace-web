import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

// What a route shows when rendering it threw: something to read, and a way out
export function RouteErrorPage() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">This page could not be shown. Reloading usually helps.</p>
      {detail && <code className="rounded-lg bg-muted px-3 py-2 text-xs break-words">{detail}</code>}
      <div className="flex flex-wrap gap-2">
        <Button className="h-11 rounded-[10px] font-bold" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-[10px]">
          <Link to="/" reloadDocument>
            Go to your workspaces
          </Link>
        </Button>
      </div>
    </main>
  )
}

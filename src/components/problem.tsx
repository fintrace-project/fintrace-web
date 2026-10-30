import { Button } from '@/components/ui/button'
import { ForbiddenError, problemOf } from '@/core/api'

// Core's `detail` says what went wrong; on a server failure its trace id is what to quote when reporting it
export function Problem({ error, onReload }: { error: Error; onReload?: () => void }) {
  const problem = problemOf(error)

  if (problem?.code === 'VERSION_CONFLICT' && onReload) {
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm text-destructive">
        This changed since the page loaded.
        <Button type="button" variant="outline" className="h-9" onClick={onReload}>
          Reload
        </Button>
      </span>
    )
  }
  if (error instanceof ForbiddenError) {
    return <span className="text-sm text-destructive">You do not have access to do this.</span>
  }
  return (
    <span className="flex flex-col gap-0.5 text-sm text-destructive">
      {error.message}
      {problem?.traceId && problem.status >= 500 && (
        <span className="text-xs text-muted-foreground">
          Reference: <code className="select-all">{problem.traceId}</code>
        </span>
      )}
    </span>
  )
}

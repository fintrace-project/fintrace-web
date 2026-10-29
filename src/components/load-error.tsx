import { Button } from '@/components/ui/button'
import { UnauthorizedError } from '@/core/api'

// A 401 is already on its way to sign-in (the QueryCache handler), so it is not shown as a failure.
export function LoadError({ what, error, onRetry }: { what: string; error: Error; onRetry: () => void }) {
  if (error instanceof UnauthorizedError) {
    return <p className="text-sm text-muted-foreground">Signing in…</p>
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-destructive">
        Could not load {what}: {error.message}
      </p>
      <Button variant="outline" className="h-11 md:h-8" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

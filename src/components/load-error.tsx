import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import { UnauthorizedError } from '@/core/api'

// A 401 is already on its way to sign-in (the QueryCache handler), so it is not shown as a failure.
export function LoadError({ what, error, onRetry }: { what: string; error: Error; onRetry: () => void }) {
  if (error instanceof UnauthorizedError) {
    return <p className="text-sm text-muted-foreground">Signing in…</p>
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm font-medium">Could not load {what}.</p>
      <Problem error={error} />
      <Button variant="outline" className="h-11 md:h-8" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Button asChild variant="outline">
        <Link to="/">Back to the overview</Link>
      </Button>
    </section>
  )
}

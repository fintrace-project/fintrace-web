import { PageHeader } from '@/components/page-header'

export function OperationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Operations" />
      <p className="text-sm text-muted-foreground">The operations feed arrives with 4.5.</p>
    </div>
  )
}

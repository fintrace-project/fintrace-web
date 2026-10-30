import { PageHeader } from '@/components/page-header'

export function StatisticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Statistics" />
      <p className="text-sm text-muted-foreground">The category breakdown arrives with 4.11.</p>
    </div>
  )
}

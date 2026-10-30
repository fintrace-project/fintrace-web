import { PageHeader } from '@/components/page-header'

export function WorkspaceNewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New workspace" />
      <p className="text-sm text-muted-foreground">The create form arrives with 4.3.</p>
    </div>
  )
}

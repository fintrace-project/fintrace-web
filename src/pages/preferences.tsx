import { PageHeader } from '@/components/page-header'

export function PreferencesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Preferences" />
      <p className="text-sm text-muted-foreground">Nothing to set yet.</p>
    </div>
  )
}

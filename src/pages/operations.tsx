import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

export function OperationsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.operations')} />
      <p className="text-sm text-muted-foreground">{t('operations.pending')}</p>
    </div>
  )
}

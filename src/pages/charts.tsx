import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

export function ChartsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('sections.charts')} />
      <p className="text-sm text-muted-foreground">{t('charts.pending')}</p>
    </div>
  )
}

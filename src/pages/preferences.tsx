import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/page-header'

export function PreferencesPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('preferences.title')} />
      <p className="text-sm text-muted-foreground">{t('preferences.empty')}</p>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import { UnauthorizedError } from '@/core/api'

// A 401 is already on its way to sign-in (the QueryCache handler), so it is not shown as a failure.
// `title` is a whole sentence ("Could not load accounts."): pieced together, it would not translate.
export function LoadError({ title, error, onRetry }: { title: string; error: Error; onRetry: () => void }) {
  const { t } = useTranslation()
  if (error instanceof UnauthorizedError) {
    return <p className="text-sm text-muted-foreground">{t('errors.signingIn')}</p>
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm font-medium">{title}</p>
      <Problem error={error} />
      <Button variant="outline" className="h-11 md:h-8" onClick={onRetry}>
        {t('common.tryAgain')}
      </Button>
    </div>
  )
}

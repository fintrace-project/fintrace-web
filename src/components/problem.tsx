import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ApiError, ForbiddenError, problemOf } from '@/core/api'

// Core's `detail` says what went wrong; on a server failure its trace id is what to quote when reporting it.
// Without a detail the error's own message is a developer's, so the user reads a sentence from en.yml instead.
export function Problem({ error, onReload }: { error: Error; onReload?: () => void }) {
  const { t } = useTranslation()
  const problem = problemOf(error)

  if (problem?.code === 'VERSION_CONFLICT' && onReload) {
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm text-destructive">
        {t('errors.changedElsewhere')}
        <Button type="button" variant="outline" className="h-9" onClick={onReload}>
          {t('common.reload')}
        </Button>
      </span>
    )
  }
  if (error instanceof ForbiddenError) {
    return <span className="text-sm text-destructive">{t('errors.forbidden')}</span>
  }

  // fetch rejects with a TypeError when the request never got an answer
  const message =
    problem?.detail ??
    (error instanceof ApiError
      ? t('errors.serverAnswered', { status: error.status })
      : error instanceof TypeError
        ? t('errors.network')
        : t('errors.unexpected'))

  return (
    <span className="flex flex-col gap-0.5 text-sm text-destructive">
      {message}
      {problem?.traceId && problem.status >= 500 && (
        <span className="text-xs text-muted-foreground">
          <Trans
            i18nKey="errors.reference"
            values={{ traceId: problem.traceId }}
            components={{ code: <code className="select-all" /> }}
          />
        </span>
      )}
    </span>
  )
}

import { Pencil } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'

export function CommentInput({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error: string | undefined
}) {
  const { t } = useTranslation()
  const errorId = useId()
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Pencil
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label={t('operations.form.comment')}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('operations.form.commentPlaceholder')}
          maxLength={255}
          autoComplete="off"
          className="h-11 rounded-full border-outline bg-card pl-9 md:h-10"
        />
      </div>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}

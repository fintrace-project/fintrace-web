import { CalendarClock } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addDays, isoDate, localDate, nowLocal } from '@/core/dates'
import { firstDayOfWeek, formatPickerDay } from '@/core/format'
import { useMediaQuery, WIDE } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

const face =
  'relative flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-base outline-none md:text-sm'
const invalid = 'border-destructive ring-3 ring-destructive/20'

// A floating `YYYY-MM-DDTHH:mm`, nothing after now: Core refuses an operation dated in the future (4.18
// may change that). One row saying the day and the time: a phone opens its own native picker from it;
// from md up, a popover holds a calendar, the time and Now.
export function DateTimePicker({
  value,
  onChange,
  error,
  className,
}: {
  value: string
  onChange: (value: string) => void
  error: string | undefined
  className?: string
}) {
  const { t } = useTranslation()
  const timeId = useId()
  const wide = useMediaQuery(WIDE)
  const [open, setOpen] = useState(false)
  // The limit is now as of the last opening or Now, so a form left open a while still reaches the present
  const [max, setMax] = useState(nowLocal)
  const refreshMax = () => {
    const now = nowLocal()
    setMax(now)
    return now
  }

  const today = max.slice(0, 10)
  const date = value.slice(0, 10)
  const time = value.slice(11, 16)
  const day =
    date === today
      ? t('operations.form.today')
      : date === addDays(today, -1)
        ? t('operations.form.yesterday')
        : formatPickerDay(date, today)

  // The label is read out with the value; seen, the icon says what the field is
  const shown = (
    <>
      <CalendarClock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="sr-only">{t('operations.form.occurredAt')}</span>
      <span className="min-w-0 flex-1 truncate">{day}</span>
      <span className="text-muted-foreground tabular-nums">{time}</span>
    </>
  )

  // A later time on today is pulled back to `max`, so picking today never lands in the future
  const pickDay = (next: string) => {
    const picked = `${next}T${time}`
    onChange(picked > max ? max : picked)
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {wide ? (
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (next) {
              refreshMax()
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-invalid={!!error}
              className={cn(
                face,
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                error && invalid,
              )}
            >
              {shown}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto overflow-hidden p-0">
            <Calendar
              mode="single"
              required
              selected={localDate(date)}
              defaultMonth={localDate(date)}
              onSelect={(picked) => pickDay(isoDate(picked))}
              disabled={{ after: localDate(today) }}
              endMonth={localDate(today)}
              captionLayout="dropdown"
              weekStartsOn={(firstDayOfWeek() % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              autoFocus
              className="[--cell-size:--spacing(9)]"
            />
            <div className="flex items-center gap-3 border-t p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(refreshMax())
                  setOpen(false)
                }}
              >
                {t('operations.form.now')}
              </Button>
              <label htmlFor={timeId} className="ml-auto text-[13px] text-muted-foreground">
                {t('operations.form.time')}
              </label>
              <Input
                id={timeId}
                type="time"
                value={time}
                max={date === today ? max.slice(11, 16) : undefined}
                onChange={(event) => event.target.value && onChange(`${date}T${event.target.value}`)}
                required
                className="h-9 w-28"
              />
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        // Laid over the field, unseen: a tap reaches the native input, which opens the phone's own picker
        <label
          className={cn(
            face,
            'has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
            error && invalid,
          )}
        >
          {shown}
          <input
            type="datetime-local"
            aria-invalid={!!error}
            value={value}
            max={max}
            onChange={(event) => event.target.value && onChange(event.target.value)}
            // A tap alone opens the picker in some browsers only; Chrome focuses a hidden date segment instead
            onClick={(event) => {
              refreshMax()
              try {
                event.currentTarget.showPicker()
              } catch {
                // Not supported, or refused outside a user gesture: the browser's own tap behaviour remains
              }
            }}
            required
            // Sized explicitly: iOS gives a date input its own width otherwise, and a tap could miss it
            className="absolute inset-0 h-full w-full appearance-none opacity-0"
          />
        </label>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

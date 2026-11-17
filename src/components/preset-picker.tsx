import { useTranslation } from 'react-i18next'
import { PRESETS, presetWindow, type DateWindow, type Preset } from '@/core/charts/windows'
import { cn } from '@/lib/utils'

// The spans a chart can show at a tap; the one matching the window shown is pressed
export function PresetPicker({
  history,
  window,
  onPick,
  small = false,
  className,
}: {
  // Where "All" begins and every span ends
  history: DateWindow
  window: DateWindow
  onPick: (window: DateWindow, preset: Preset) => void
  // A panel's quieter row, under its chart
  small?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div
      role="group"
      aria-label={t('charts.range')}
      className={cn('flex gap-1 bg-muted/60', small ? 'rounded-lg p-0.5' : 'rounded-xl p-1', className)}
    >
      {PRESETS.map((preset) => {
        const shown = presetWindow(preset, history)
        const active = shown.from === window.from && shown.to === window.to
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(shown, preset)}
            className={cn(
              'flex-1 font-bold transition-colors',
              small ? 'min-h-8 rounded-md px-2 text-xs' : 'min-h-11 rounded-lg px-2.5 text-sm md:min-h-9',
              active ? 'bg-card shadow-xs' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`charts.presets.${preset}`)}
          </button>
        )
      })}
    </div>
  )
}

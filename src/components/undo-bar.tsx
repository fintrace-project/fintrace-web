import { useState, type AnimationEvent } from 'react'
import { useTranslation } from 'react-i18next'

type Shown = { id: string; message: string }

// The outer element is always there, so a screen reader is already watching it when the bar appears
export function UndoBar({
  id,
  message,
  windowMs,
  onUndo,
}: {
  id: string | undefined
  message: string | undefined
  windowMs: number
  onUndo: () => void
}) {
  const { t } = useTranslation()
  // Kept after the message goes, so the bar can slide out rather than vanish
  const [shown, setShown] = useState<Shown>()
  if (id && message && (shown?.id !== id || shown.message !== message)) {
    setShown({ id, message })
  }
  const leaving = shown !== undefined && !(id && message)

  // The time-left line's own end bubbles here too, and must not unmount the bar
  const onAnimationEnd = (event: AnimationEvent) => {
    if (leaving && event.target === event.currentTarget) {
      setShown(undefined)
    }
  }

  return (
    <div role="status">
      {shown && (
        <div className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-60 flex justify-center md:right-8 md:bottom-8 md:left-auto">
          <div
            key={shown.id}
            inert={leaving}
            onAnimationEnd={onAnimationEnd}
            className={[
              'pointer-events-auto relative flex h-11 max-w-full items-center gap-1 overflow-hidden rounded-full bg-card pl-5 text-sm text-card-foreground shadow-md ring-1 ring-foreground/10',
              leaving
                ? 'fill-mode-forwards duration-150 ease-in animate-out fade-out-0 motion-safe:slide-out-to-bottom-6'
                : 'duration-250 ease-out animate-in fade-in-0 motion-safe:slide-in-from-bottom-6',
            ].join(' ')}
          >
            <span className="min-w-0 truncate">{shown.message}</span>
            <button
              type="button"
              onClick={onUndo}
              className="h-11 shrink-0 rounded-full px-4 font-bold text-(--ws) outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('feed.undo')}
            </button>
            {!leaving && (
              <span
                aria-hidden
                style={{ animationDuration: `${windowMs}ms` }}
                className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-undo-window bg-(--ws)/40 motion-reduce:hidden"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

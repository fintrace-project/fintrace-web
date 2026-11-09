import { useTranslation } from 'react-i18next'

// The outer element is always there, so a screen reader is already watching it when the bar appears
export function UndoBar({ message, onUndo }: { message: string | undefined; onUndo: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      {message && (
        <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-60 flex items-center justify-between gap-3 rounded-2xl bg-foreground py-1 pr-1 pl-4 text-sm text-background shadow-lg duration-200 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none md:right-8 md:bottom-8 md:left-auto md:w-96">
          <span className="min-w-0 truncate">{message}</span>
          <button
            type="button"
            onClick={onUndo}
            className="h-11 shrink-0 rounded-xl px-4 font-bold outline-none focus-visible:ring-3 focus-visible:ring-background/60"
          >
            {t('feed.undo')}
          </button>
        </div>
      )}
    </div>
  )
}

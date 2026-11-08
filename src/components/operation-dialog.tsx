import { Plus } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pending } from '@/components/cards'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import type { Workspace } from '@/core/api'
import { accentOf } from '@/lib/accent'

// The form brings the calendar and the category search: its own chunk, kept out of the page's, but fetched
// as soon as the button shows rather than on the first opening. The browser keeps one copy of a module, so
// the preload and `lazy` share the same request.
const loadForm = () => import('@/components/operation-form')
const OperationLoader = lazy(() => loadForm().then((m) => ({ default: m.OperationLoader })))

// The page header's button and its form. On an account's page that account comes preselected.
export function AddOperationButton({ workspace, accountId }: { workspace: Workspace; accountId?: string }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const writable = workspace.status === 'NEW' || workspace.status === 'ACTIVE'

  // After the page has rendered, so it never competes with the first paint
  useEffect(() => {
    if (writable) {
      void loadForm()
    }
  }, [writable])

  if (!writable) {
    return null
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-[10px] bg-(--ws) px-4 font-bold text-white hover:bg-(--ws)/85">
          <Plus aria-hidden />
          {t('operations.add')}
        </Button>
      </DialogTrigger>
      {/* The amount field focuses itself when it mounts, which may be after the form's chunk arrives. No
          description: the title says it all, and on a NEW workspace the page's banner already says this
          closes import. */}
      {/* The dialog is portalled out of the shell that sets the workspace's colour, so it sets its own. Its
          own close button is left out: the form draws a round one beside the kind switch. */}
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        style={accentOf(workspace.id)}
        // Full screen on a phone, the form's button pinned at the bottom; from md up, the centred dialog. On the
        // workspace's tint with white controls, as the pages are, and a thin scrollbar in its colour. No bottom
        // padding: the pinned strip holds it, so nothing scrolls past beneath the button.
        className="top-0 right-0 bottom-0 left-0 flex bg-(--ws-soft) max-h-none max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none pb-0 [scrollbar-color:color-mix(in_srgb,var(--ws)_35%,transparent)_transparent] [scrollbar-width:thin] sm:max-w-none md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl"
      >
        <Suspense fallback={<Pending>{t('common.loading')}</Pending>}>
          <OperationLoader workspace={workspace} accountId={accountId} onDone={() => setOpen(false)} />
        </Suspense>
      </DialogContent>
    </Dialog>
  )
}

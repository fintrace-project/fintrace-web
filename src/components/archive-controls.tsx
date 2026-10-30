import { Archive, ArchiveRestore } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import type { Workspace } from '@/core/api'
import { useSetArchived } from '@/hooks/use-workspace-mutations'

// Archiving is reversible, so it takes one click and no confirmation (§4.1.1); the banner below is its undo
export function ArchiveButton({ workspace }: { workspace: Workspace }) {
  const setArchived = useSetArchived(workspace.id)
  const { t } = useTranslation()

  if (workspace.status !== 'ACTIVE') {
    return null
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={setArchived.isPending}
        onClick={() => setArchived.mutate(true)}
        className="h-11 rounded-[10px] bg-card px-4 font-semibold"
      >
        <Archive aria-hidden />
        {t(setArchived.isPending ? 'archive.archiving' : 'archive.archive')}
      </Button>
      {setArchived.error && <Problem error={setArchived.error} />}
    </div>
  )
}

// Every page of an archived workspace says so: it explains why nothing can be changed, and offers the way back
export function ArchivedBanner({ workspace }: { workspace: Workspace }) {
  const setArchived = useSetArchived(workspace.id)
  const { t } = useTranslation()

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-(--ws)/30 bg-(--ws-soft) px-4 py-3"
    >
      <Archive className="size-5 shrink-0 text-(--ws)" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <Trans i18nKey="archive.banner" components={{ b: <b className="font-bold" /> }} />
      </p>
      <Button
        disabled={setArchived.isPending}
        onClick={() => setArchived.mutate(false)}
        className="h-11 rounded-[10px] px-4 font-bold md:h-9"
      >
        <ArchiveRestore aria-hidden />
        {t(setArchived.isPending ? 'archive.unarchiving' : 'archive.unarchive')}
      </Button>
      {setArchived.error && (
        <div className="basis-full">
          <Problem error={setArchived.error} />
        </div>
      )}
    </div>
  )
}

import { Archive, ArchiveRestore } from 'lucide-react'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import type { Workspace } from '@/core/api'
import { useSetArchived } from '@/hooks/use-workspace-mutations'

// Archiving is reversible, so it takes one click and no confirmation (§4.1.1); the banner below is its undo
export function ArchiveButton({ workspace }: { workspace: Workspace }) {
  const setArchived = useSetArchived(workspace.id)

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
        {setArchived.isPending ? 'Archiving…' : 'Archive'}
      </Button>
      {setArchived.error && <Problem error={setArchived.error} />}
    </div>
  )
}

// Every page of an archived workspace says so: it explains why nothing can be changed, and offers the way back
export function ArchivedBanner({ workspace }: { workspace: Workspace }) {
  const setArchived = useSetArchived(workspace.id)

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-(--ws)/30 bg-(--ws-soft) px-4 py-3"
    >
      <Archive className="size-5 shrink-0 text-(--ws)" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <b className="font-bold">This workspace is archived.</b> It is read-only: everything in it stays,
        nothing can be added or changed.
      </p>
      <Button
        disabled={setArchived.isPending}
        onClick={() => setArchived.mutate(false)}
        className="h-11 rounded-[10px] px-4 font-bold md:h-9"
      >
        <ArchiveRestore aria-hidden />
        {setArchived.isPending ? 'Unarchiving…' : 'Unarchive'}
      </Button>
      {setArchived.error && (
        <div className="basis-full">
          <Problem error={setArchived.error} />
        </div>
      )}
    </div>
  )
}

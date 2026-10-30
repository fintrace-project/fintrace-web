import { FileUp } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Workspace } from '@/core/api'

// Said before the first manual write, not after: that write closes import for good (§4.1.1)
export function NewWorkspaceBanner({ workspace }: { workspace: Workspace }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-(--ws)/30 bg-(--ws-soft) px-4 py-3"
    >
      <FileUp className="size-5 shrink-0 text-(--ws)" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        <b className="font-bold">This workspace is new and empty.</b> You can import your history from another
        app now. Anything you add yourself closes import for good.
      </p>
      <Button asChild className="h-11 rounded-[10px] px-4 font-bold md:h-9">
        <Link to={`/w/${workspace.id}/import`}>Import history</Link>
      </Button>
    </div>
  )
}

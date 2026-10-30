import type { Workspace } from '@/core/api'
import { initials } from '@/core/format'
import { cn } from '@/lib/utils'
import { accentOf } from '@/lib/accent'

export function WorkspaceAvatar({
  workspace,
  className,
}: {
  workspace: Pick<Workspace, 'id' | 'name'>
  className?: string
}) {
  return (
    <span
      aria-hidden
      style={accentOf(workspace.id)}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--ws) text-sm font-extrabold text-white',
        className,
      )}
    >
      {initials(workspace.name)}
    </span>
  )
}

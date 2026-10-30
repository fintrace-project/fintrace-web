import type { Workspace } from '@/core/api'

const statusLabels: Record<Workspace['status'], string> = {
  NEW: 'New',
  IMPORTING: 'Importing',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
}

export const workspaceStatus = (workspace: Workspace) => statusLabels[workspace.status]

export const workspaceSummary = (workspace: Workspace) =>
  `${workspace.defaultCurrency} · ${workspaceStatus(workspace)}`

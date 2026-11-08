import type { Workspace } from '@/core/api'

// Core takes commands for a NEW or ACTIVE workspace only: an archived or deleted one is read-only
export const isWritable = (workspace: Workspace) =>
  workspace.status === 'NEW' || workspace.status === 'ACTIVE'

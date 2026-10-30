import type { Workspace } from '@/core/api'
import { t } from '@/core/i18n'

export const workspaceStatus = (workspace: Workspace) => t(`workspaceStatus.${workspace.status}`)

export const workspaceSummary = (workspace: Workspace) =>
  t('workspaceSummary', { currency: workspace.defaultCurrency, status: workspaceStatus(workspace) })

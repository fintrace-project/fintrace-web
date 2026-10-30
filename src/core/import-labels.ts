import type { components } from '@/core/api/schema'
import { t } from '@/core/i18n'

type Schemas = components['schemas']

// The importer's codes in words a person reading the result understands
export const problemLabel = (code: Schemas['ImportProblemCode']) => t(`importProblem.${code}`)

export const diagnosticLabel = (code: Schemas['ImportDiagnosticCode']) => t(`importDiagnostic.${code}`)

export const entityCount = (type: Schemas['EntityType'], count: number) => t(`entities.${type}`, { count })

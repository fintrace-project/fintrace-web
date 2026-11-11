import type { components } from '@/core/api/schema'
import { t } from '@/core/i18n'

type Schemas = components['schemas']

// The importer's codes in words a person reading the result understands
export const problemLabel = (code: Schemas['ImportProblemCode']) => t(`importProblem.${code}`)

export const diagnosticLabel = (code: Schemas['ImportDiagnosticCode']) => t(`importDiagnostic.${code}`)

export const entityCount = (type: Schemas['EntityType'], count: number) => t(`entities.${type}`, { count })

export interface DiagnosticGroup {
  code: Schemas['ImportDiagnosticCode']
  severity: Schemas['ImportDiagnosticSeverity']
  count: number
  details: { detail: string; count: number }[]
}

// One entry per code, in the order the importer sent them: it reports each detail apart, which would repeat a
// heading. An error anywhere in a group makes the group an error
export function groupDiagnostics(diagnostics: Schemas['ImportDiagnosticDTO'][]): DiagnosticGroup[] {
  const groups = new Map<string, DiagnosticGroup>()
  for (const { code, severity, count, detail } of diagnostics) {
    const group = groups.get(code) ?? { code, severity, count: 0, details: [] }
    group.count += count
    if (severity === 'ERROR') {
      group.severity = 'ERROR'
    }
    if (detail) {
      group.details.push({ detail, count })
    }
    groups.set(code, group)
  }
  return [...groups.values()]
}

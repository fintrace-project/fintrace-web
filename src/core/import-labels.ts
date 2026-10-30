import type { components } from '@/core/api/schema'

type Schemas = components['schemas']

// The importer's codes in words a person reading the result understands
const problems: Record<Schemas['ImportProblemCode'], string> = {
  WRONG_UUID_VERSION: 'Malformed identifier',
  DUPLICATED_ENTITY_ID_WITHIN_SECTION: 'Duplicate record',
  DUPLICATED_ENTITY_ID_ACROSS_SECTIONS: 'Duplicate record',
  UNRESOLVED_REFERENCE: 'Missing reference',
  CYCLIC_REFERENCES: 'Circular reference',
  REFUSED_BY_COMMAND: 'Refused by fintrace',
}

const diagnostics: Record<Schemas['ImportDiagnosticCode'], string> = {
  UNSUPPORTED_RECORD: 'Records skipped as unsupported',
  UNKNOWN_CURRENCY: 'Records skipped for an unknown currency',
  UNRESOLVED_REFERENCE: 'Records with a missing reference',
  SOURCE_ANOMALY: 'Irregularities in the source',
}

const entities: Record<Schemas['EntityType'], [string, string]> = {
  OPERATION: ['operation', 'operations'],
  ACCOUNT: ['account', 'accounts'],
  CATEGORY: ['category', 'categories'],
  TRANSFER: ['transfer', 'transfers'],
  BALANCE_ANCHOR: ['balance anchor', 'balance anchors'],
}

export const problemLabel = (code: Schemas['ImportProblemCode']) => problems[code]

export const diagnosticLabel = (code: Schemas['ImportDiagnosticCode']) => diagnostics[code]

export const entityCount = (type: Schemas['EntityType'], n: number) =>
  `${n} ${entities[type][n === 1 ? 0 : 1]}`

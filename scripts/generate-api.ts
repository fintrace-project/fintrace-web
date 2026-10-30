// Generates src/core/api/schema.d.ts from Core's openapi.json: the release pinned as coreApiVersion in
// package.json, or a file named as the argument (or CORE_SPEC) for an unreleased spec.
//   npm run generate:api
//   npm run generate:api -- core-openapi.json
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUTPUT = 'src/core/api/schema.d.ts'
// openapi-typescript wants TypeScript 5 as a peer, so it runs through npx rather than as a dependency
const GENERATOR = 'openapi-typescript@7.13.0'

// Paths the BFF never passes a browser through (plans/M5.md). A missed one only types a call that answers
// 404, so a denylist is safe here, unlike the BFF's own allowlist.
const UNREACHABLE = [/^\/admin\//, /^\/api\/v1\/users\/current\/id$/, /\/import$/]

interface Spec {
  paths: Record<string, unknown>
}

async function loadSpec(): Promise<Spec> {
  const file = process.argv[2] ?? process.env.CORE_SPEC
  if (file) {
    return JSON.parse(readFileSync(file, 'utf8')) as Spec
  }
  const { coreApiVersion } = JSON.parse(readFileSync('package.json', 'utf8')) as { coreApiVersion: string }
  const url = `https://github.com/fintrace-project/fintrace-core/releases/download/v${coreApiVersion}/openapi.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}: is Core v${coreApiVersion} released? Use CORE_SPEC`)
  }
  return (await response.json()) as Spec
}

const spec = await loadSpec()
for (const path of Object.keys(spec.paths)) {
  if (UNREACHABLE.some((pattern) => pattern.test(path))) {
    delete spec.paths[path]
  }
}

const dir = mkdtempSync(join(tmpdir(), 'fintrace-api-'))
try {
  const input = join(dir, 'openapi.json')
  writeFileSync(input, JSON.stringify(spec))
  execFileSync('npx', ['--yes', GENERATOR, input, '--output', OUTPUT], { stdio: 'inherit' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}

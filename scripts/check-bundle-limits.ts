// Fails when the production build's JavaScript outgrows the bundle limits (§3.6): the first load, and
// what each lazily loaded chunk adds on top of it. Sizes are gzipped, as nginx serves them.
//   npm run build && npm run check:bundle-limits
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const DIST = 'dist'
const INITIAL_LIMIT = 200_000
const LAZY_LIMIT = 50_000

type Chunk = { file: string; isEntry?: boolean; isDynamicEntry?: boolean; imports?: string[] }
const manifest = JSON.parse(readFileSync(`${DIST}/.vite/manifest.json`, 'utf8')) as Record<string, Chunk>

const gzipped = (file: string) => gzipSync(readFileSync(`${DIST}/${file}`), { level: 9 }).length

// A chunk and every chunk it imports statically, which the browser fetches before running it
function closure(key: string, into = new Set<string>()): Set<string> {
  if (!into.has(key)) {
    into.add(key)
    manifest[key].imports?.forEach((imported) => closure(imported, into))
  }
  return into
}

const sizeOf = (keys: Iterable<string>) =>
  [...keys].reduce((sum, key) => sum + gzipped(manifest[key].file), 0)
const kB = (bytes: number) => `${(bytes / 1000).toFixed(2)} kB`

const initial = new Set<string>()
Object.keys(manifest)
  .filter((key) => manifest[key].isEntry)
  .forEach((key) => closure(key, initial))

const failures: string[] = []
const initialSize = sizeOf(initial)
console.log(`${'first load'.padEnd(40)} ${kB(initialSize).padStart(10)}  of ${kB(INITIAL_LIMIT)}`)
if (initialSize > INITIAL_LIMIT) {
  failures.push(`the first load is ${kB(initialSize)}, over ${kB(INITIAL_LIMIT)}`)
}

for (const key of Object.keys(manifest).filter((key) => manifest[key].isDynamicEntry)) {
  const added = [...closure(key)].filter((chunk) => !initial.has(chunk))
  const size = sizeOf(added)
  console.log(`${key.padEnd(40)} ${kB(size).padStart(10)}  of ${kB(LAZY_LIMIT)}`)
  if (size > LAZY_LIMIT) {
    failures.push(`${key} adds ${kB(size)}, over ${kB(LAZY_LIMIT)}`)
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`over the limit: ${failure}`))
  process.exit(1)
}

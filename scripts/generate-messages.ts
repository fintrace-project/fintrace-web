// Generates src/core/i18n/en.d.yml.ts, the type of en.yml, so i18next checks every key and every {{param}}
// at compile time. TypeScript reads it for `import en from './en.yml'` (allowArbitraryExtensions).
//   npm run generate:messages
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const SOURCE = 'src/core/i18n/en.yml'
const OUTPUT = 'src/core/i18n/en.d.yml.ts'

type Messages = { [key: string]: string | Messages }

// Literal string types, not `string`: i18next reads the {{params}} a message expects from its text
function typeOf(node: Messages, indent: string): string {
  const lines = Object.entries(node).map(([key, value]) => {
    const name = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)
    const type = typeof value === 'string' ? JSON.stringify(value) : typeOf(value, `${indent}  `)
    return `${indent}  readonly ${name}: ${type}`
  })
  return `{\n${lines.join('\n')}\n${indent}}`
}

const messages = parse(readFileSync(SOURCE, 'utf8')) as Messages
writeFileSync(
  OUTPUT,
  `// Generated from en.yml by \`npm run generate:messages\`; do not edit.\ndeclare const messages: ${typeOf(messages, '')}\nexport default messages\n`,
)

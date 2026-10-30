import type { CSSProperties } from 'react'

// [accent, soft tint]; white text must stay readable on every accent
const palette: [string, string][] = [
  ['#2f5fd0', '#e8eefb'],
  ['#c2410c', '#fbede5'],
  ['#0f766e', '#e3f2f0'],
  ['#6d28d9', '#efe8fb'],
  ['#b45309', '#fbf0e1'],
  ['#be185d', '#fbe7f0'],
  ['#4d7c0f', '#eef4e1'],
  ['#0369a1', '#e3f0f8'],
]

// Core stores no colour: the id picks one, so a workspace or a user keeps its colour on every device.
export function accentOf(id: string): CSSProperties {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  const [accent, soft] = palette[Math.abs(hash) % palette.length]!
  return { '--ws': accent, '--ws-soft': soft } as CSSProperties
}

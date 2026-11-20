import type { CSSProperties } from 'react'

// [accent, soft tint]; white text on the accent and the accent on its tint must each reach 4.5:1
const palette: [string, string][] = [
  ['#2f5fd0', '#e8eefb'],
  ['#c2410c', '#fbede5'],
  ['#0f766e', '#e3f2f0'],
  ['#6d28d9', '#efe8fb'],
  ['#ad4f08', '#fbf0e1'],
  ['#be185d', '#fbe7f0'],
  ['#49760e', '#eef4e1'],
  ['#0369a1', '#e3f0f8'],
]

// Core stores no colour: the id picks one, so a workspace or a user keeps its colour on every device.
function paletteOf(id: string): [string, string] {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return palette[Math.abs(hash) % palette.length]!
}

export function accentOf(id: string): CSSProperties {
  const [accent, soft] = paletteOf(id)
  return { '--ws': accent, '--ws-soft': soft } as CSSProperties
}

// The accent itself, for a canvas, which reads no CSS variable
export const accentColour = (id: string) => paletteOf(id)[0]

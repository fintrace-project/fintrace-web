// Floating local wall-clock values, as Core stores them: never converted to UTC (§6.4).
const pad = (n: number) => String(n).padStart(2, '0')

export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function nowLocal(): string {
  const d = new Date()
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

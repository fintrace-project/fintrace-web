import { useCallback, useSyncExternalStore } from 'react'

// Tailwind's `md`: the width from which the shell shows the sidebar rather than the tab bar
export const WIDE = '(min-width: 48rem)'

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

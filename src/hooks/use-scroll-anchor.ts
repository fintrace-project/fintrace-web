import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type ScrollDirection = 'up' | 'down'

const itemAt = (list: HTMLElement, cursor: string) =>
  list.querySelector(`[data-cursor="${CSS.escape(cursor)}"]`)

function topItem(list: HTMLElement) {
  for (const element of list.querySelectorAll<HTMLElement>('[data-cursor]')) {
    const { top, bottom } = element.getBoundingClientRect()
    if (bottom > 0) {
      return { cursor: element.dataset.cursor!, top }
    }
  }
  return null
}

// Holds the item at the top of the screen in place when pages are added or dropped around it. By hand
// because Safari has no scroll anchoring, so the list switches the browser's off. At the head of the
// list, scrolled to the top, nothing is held: a new item should appear, not be scrolled past.
// A new `focus` is a jump instead: the one effect decides, so holding can never undo a jump.
// `direction` is the way the reader is going, its own corrections aside, for the list to load only that way.
export function useScrollAnchor(atHead: boolean, focus: string | undefined) {
  const list = useRef<HTMLDivElement>(null)
  const anchor = useRef<ReturnType<typeof topItem>>(null)
  const head = useRef(atHead)
  const focused = useRef<string>(undefined)
  const corrected = useRef(false)
  // Kept with the jump it belongs to: after a new one the feed may load either way from where it lands
  const [going, setGoing] = useState<{ focus: string | undefined; direction: ScrollDirection }>()
  const direction = going && going.focus === focus ? going.direction : null

  const setDirection = useCallback((next: ScrollDirection) => {
    const from = focused.current
    setGoing((current) =>
      current && current.focus === from && current.direction === next
        ? current
        : { focus: from, direction: next },
    )
  }, [])

  const record = useRef(() => {
    anchor.current = list.current && (window.scrollY > 0 || !head.current) ? topItem(list.current) : null
  })

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (corrected.current) {
        corrected.current = false
      } else if (y !== lastY) {
        setDirection(y > lastY ? 'down' : 'up')
      }
      lastY = y
      record.current()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [setDirection])

  // On every commit, before the browser paints
  useLayoutEffect(() => {
    head.current = atHead
    const held = anchor.current
    if (focus !== focused.current) {
      focused.current = focus
      corrected.current = true
      if (focus && list.current) {
        itemAt(list.current, focus)?.scrollIntoView({ block: 'center' })
      } else {
        window.scrollTo(0, 0)
      }
    } else if (held && list.current) {
      const element = itemAt(list.current, held.cursor)
      const shift = element ? element.getBoundingClientRect().top - held.top : 0
      if (shift !== 0) {
        corrected.current = true
        window.scrollBy(0, shift)
      }
    }
    record.current()
  })

  return { list, direction, setDirection }
}

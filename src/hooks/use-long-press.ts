import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

const HOLD_MS = 500
// A finger is never perfectly still; further than this is a scroll starting
const SLOP_PX = 10

// Touch only: a mouse has right-click and the visible menu button
export function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const origin = useRef({ x: 0, y: 0 })
  const fired = useRef(false)

  const cancel = () => window.clearTimeout(timer.current)
  useEffect(() => cancel, [])

  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') {
        return
      }
      fired.current = false
      origin.current = { x: event.clientX, y: event.clientY }
      cancel()
      timer.current = window.setTimeout(() => {
        fired.current = true
        navigator.vibrate?.(10)
        onLongPress()
      }, HOLD_MS)
    },
    onPointerMove: (event: PointerEvent) => {
      if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > SLOP_PX) {
        cancel()
      }
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    // The click that follows the hold must not also tap the tile
    onClickCapture: (event: MouseEvent) => {
      if (fired.current) {
        fired.current = false
        event.preventDefault()
        event.stopPropagation()
      }
    },
    // Android's own long-press menu; a mouse's right-click reports a pointerType of mouse and keeps its menu
    onContextMenu: (event: MouseEvent) => {
      if ((event.nativeEvent as globalThis.PointerEvent).pointerType === 'touch') {
        event.preventDefault()
      }
    },
  }
}

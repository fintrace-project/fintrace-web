import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// How far a finger moves before the gesture is judged a swipe or a scroll
const LOCK = 8
// The share of the row's width past which letting go acts
const THRESHOLD = 0.4

export interface SwipeAction {
  // Shown on the strip the row uncovers as it slides
  label: string
  icon: ReactNode
  onSwipe: () => void
}

// A row a finger can slide either way; let go past the threshold and that side's action runs, short of it the
// row springs back. Sliding left removes: the row slides away for good, coming back only if `failed`. Sliding
// right acts and the row comes back. Touch only: a mouse never swipes. Vertical drags stay the browser's
// scroll (`touch-action: pan-y`), and a drag counts as a swipe only once it is clearly sideways.
export function SwipeRow({
  toLeft,
  toRight,
  failed,
  className,
  children,
}: {
  toLeft?: SwipeAction
  toRight?: SwipeAction
  failed: boolean
  className?: string
  children: ReactNode
}) {
  // The row's offset while a finger holds it, with the row's width it is measured against
  const [drag, setDrag] = useState<{ dx: number; width: number } | null>(null)
  // Slid away after a swipe left past the threshold, until the row leaves the feed or its removal is refused
  const [gone, setGone] = useState(false)
  if (gone && failed) {
    setGone(false)
  }
  const gesture = useRef<{ x: number; y: number; width: number; swiping: boolean } | null>(null)
  // A swipe ends in a click on whatever is under the finger, which must not open the row's form
  const swiped = useRef(false)

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch' || gone) {
      return
    }
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      width: event.currentTarget.offsetWidth,
      swiping: false,
    }
    swiped.current = false
  }

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current
    if (!current) {
      return
    }
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!current.swiping) {
      if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) {
        return
      }
      if (Math.abs(dy) >= Math.abs(dx)) {
        gesture.current = null
        return
      }
      current.swiping = true
      swiped.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    // Only towards a side that has an action
    const clamped = Math.max(toLeft ? -Infinity : 0, Math.min(toRight ? Infinity : 0, dx))
    setDrag({ dx: clamped, width: current.width })
  }

  const side = gone || (drag && drag.dx < 0) ? 'left' : drag && drag.dx > 0 ? 'right' : undefined
  const armed = gone || (drag !== null && Math.abs(drag.dx) > drag.width * THRESHOLD)

  const up = () => {
    if (gesture.current?.swiping && armed && drag) {
      if (drag.dx < 0) {
        setGone(true)
        toLeft?.onSwipe()
      } else {
        toRight?.onSwipe()
      }
    }
    gesture.current = null
    setDrag(null)
  }

  // The browser took the gesture over as a scroll: the row goes back to where it was
  const cancel = () => {
    gesture.current = null
    setDrag(null)
  }

  // Swallows the click a swipe ends in
  const clickCapture = (event: MouseEvent) => {
    if (swiped.current) {
      event.preventDefault()
      event.stopPropagation()
      swiped.current = false
    }
  }

  const action = side === 'left' ? toLeft : side === 'right' ? toRight : undefined

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Seen only through the gap the row leaves, on the side it leaves; deeper once letting go would act */}
      {action && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center gap-2 px-5 text-sm font-semibold text-white transition-colors [&>svg]:size-4',
            side === 'left'
              ? cn('justify-end bg-destructive/70', armed && 'bg-destructive')
              : cn('justify-start bg-(--ws)/70', armed && 'bg-(--ws)'),
          )}
        >
          {action.icon}
          {action.label}
        </div>
      )}
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onClickCapture={clickCapture}
        style={{ transform: gone ? 'translateX(-100%)' : `translateX(${drag?.dx ?? 0}px)` }}
        className={cn('relative touch-pan-y bg-card', drag === null && 'transition-transform duration-200')}
      >
        {children}
      </div>
    </div>
  )
}

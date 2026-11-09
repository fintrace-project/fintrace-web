import { useCallback, useEffect, useRef, useState } from 'react'
import type { TransferFeedItem } from '@/core/api'
import type { OperationItem } from '@/core/feed-rows'
import { useCancelOperation } from '@/hooks/use-operation-mutations'
import { useCancelTransfer } from '@/hooks/use-transfer-mutations'

const UNDO_WINDOW_MS = 5000

type Removable = OperationItem | TransferFeedItem

// A swipe's delete, held back long enough to undo: Core has no restore, so nothing is sent until the window
// closes. A second swipe or leaving the feed sends the one waiting at once.
export function useUndoableDelete(workspaceId: string) {
  const { mutate: cancelOperation } = useCancelOperation(workspaceId)
  const { mutate: cancelTransfer } = useCancelTransfer(workspaceId)
  const [pending, setPending] = useState<Removable>()
  const [undone, setUndone] = useState<string>()
  const [failure, setFailure] = useState<{ id: string; message: string }>()
  const waiting = useRef<{ item: Removable; timer: ReturnType<typeof setTimeout> } | null>(null)

  const cancel = useCallback(
    (item: Removable) => {
      const mutate = item.type === 'TRANSFER' ? cancelTransfer : cancelOperation
      mutate(item.id, { onError: (error) => setFailure({ id: item.id, message: error.message }) })
    },
    [cancelOperation, cancelTransfer],
  )

  const send = useCallback(() => {
    if (!waiting.current) {
      return
    }
    const { item, timer } = waiting.current
    clearTimeout(timer)
    waiting.current = null
    setPending(undefined)
    cancel(item)
  }, [cancel])

  useEffect(() => send, [send])

  // Clears the last refusal and undo in the same update that slides the new row away, or it would come back
  const remove = (item: Removable) => {
    send()
    setFailure(undefined)
    setUndone(undefined)
    waiting.current = { item, timer: setTimeout(send, UNDO_WINDOW_MS) }
    setPending(item)
  }

  // From the row's menu: no window to undo in, the row leaves when the feed is read again
  const removeNow = (item: Removable) => {
    send()
    setFailure(undefined)
    setUndone(undefined)
    cancel(item)
  }

  const undo = () => {
    if (!waiting.current) {
      return
    }
    clearTimeout(waiting.current.timer)
    setUndone(waiting.current.item.id)
    waiting.current = null
    setPending(undefined)
  }

  return { pending, undone, failure, remove, removeNow, undo }
}

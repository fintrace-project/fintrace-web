import { useTranslation } from 'react-i18next'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AccountBalance, BalanceAnchor } from '@/core/api'
import { balanceWithoutAnchor } from '@/core/decimal'
import { formatBalance, formatDateTime } from '@/core/format'
import { useAccountBalances } from '@/hooks/use-accounts'
import { useDeleteAnchor } from '@/hooks/use-anchors'

// Asks before deleting the account's latest anchor, showing the balance before and after. No undo bar as for an
// operation: recording it again would date it now, not when it was counted.
export function DeleteAnchorDialog({ anchor, onClose }: { anchor: BalanceAnchor; onClose: () => void }) {
  const remove = useDeleteAnchor(anchor.workspaceId, anchor.accountId)
  const balance = useAccountBalances(anchor.workspaceId).data?.find(
    (each) => each.accountId === anchor.accountId,
  )
  const { t } = useTranslation()

  // The first anchor has no earlier one to fall back to, so what is left is the operations alone, unknown here
  const after = (current: AccountBalance) =>
    anchor.difference == null
      ? t('anchors.delete.fromOperations')
      : formatBalance({ ...current, balance: balanceWithoutAnchor(current.balance, anchor.difference) })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <div className="flex min-w-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t('anchors.delete.title')}</DialogTitle>
            <DialogDescription>{t('anchors.delete.text')}</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t('anchors.delete.recorded')}</dt>
            <dd>{formatDateTime(anchor.occurredAt)}</dd>
            {balance && (
              <>
                <dt className="text-muted-foreground">{t('anchors.delete.balance')}</dt>
                <dd className="font-semibold tabular-nums">
                  {t('anchors.delete.change', { before: formatBalance(balance), after: after(balance) })}
                </dd>
              </>
            )}
          </dl>
          {remove.error && <Problem error={remove.error} />}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11 md:h-9">
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(anchor.id, { onSuccess: onClose })}
              className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9"
            >
              {t(remove.isPending ? 'anchors.delete.deleting' : 'anchors.delete.confirm')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { ArrowRight, ArrowUp, ChevronDown, Pen, Repeat2, Trash2, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { InitialsAvatar, Pending } from '@/components/cards'
import { LoadError } from '@/components/load-error'
import { OperationDialog } from '@/components/operation-dialog'
import { SwipeRow } from '@/components/swipe-row'
import { Button } from '@/components/ui/button'
import type { Account, AccountFeedItem, TransferFeedItem, TransferLeg, WorkspaceFeedItem } from '@/core/api'
import { dayTotals, feedRows, runTotal, type DifferenceItem, type OperationItem } from '@/core/feed-rows'
import {
  formatMoney,
  formatOperationAmount,
  formatRate,
  formatFeedDay,
  formatSignedMagnitude,
  initials,
} from '@/core/format'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useCancelOperation } from '@/hooks/use-operation-mutations'
import { useCancelTransfer } from '@/hooks/use-transfer-mutations'
import { useWorkspace } from '@/hooks/use-workspaces'
import { isWritable } from '@/core/workspaces'
import { useScrollAnchor } from '@/hooks/use-scroll-anchor'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

type FeedItem = WorkspaceFeedItem | AccountFeedItem

const rowLayout = 'flex min-h-14 w-full items-center gap-3 py-2.5'
// A row that opens its operation reaches the card's edges, so the tint under the pointer and the red strip a
// swipe uncovers do too; the row's own padding puts its content back in line
const bleed = '-mx-4 w-[calc(100%+2rem)] md:-mx-5 md:w-[calc(100%+2.5rem)]'
const editableRow = 'px-4 text-left outline-none hover:bg-(--ws-soft)/60 focus-visible:bg-(--ws-soft) md:px-5'

// The swipe's delete, held by the feed: a refused one brings its row back with Core's word under it
interface Swipe {
  remove: (item: OperationItem | TransferFeedItem) => void
  repeat: (item: OperationItem | TransferFeedItem) => void
  failure: { id: string; message: string } | undefined
}

// An operation or a transfer that opens in its form on a tap; on a phone, a swipe left deletes it, a transfer's
// both legs at once, and a swipe right opens a new one made from it
function EditableRow({
  item,
  onEdit,
  swipe,
  className,
  children,
}: {
  item: OperationItem | TransferFeedItem
  onEdit: () => void
  swipe: Swipe
  className: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const failure = swipe.failure?.id === item.id ? swipe.failure : undefined
  return (
    <>
      <SwipeRow
        toLeft={{
          label: t('operations.form.delete'),
          icon: <Trash2 aria-hidden />,
          onSwipe: () => swipe.remove(item),
        }}
        toRight={{
          label: t('operations.form.repeat'),
          icon: <Repeat2 aria-hidden />,
          onSwipe: () => swipe.repeat(item),
        }}
        failed={failure !== undefined}
        className={bleed}
      >
        <button type="button" onClick={onEdit} className={cn(editableRow, className)}>
          {children}
        </button>
      </SwipeRow>
      {failure && <p className="pb-2 text-xs text-destructive">{failure.message}</p>}
    </>
  )
}

type TransferItem = Extract<FeedItem, { type: 'TRANSFER' }>
type AccountName = (accountId: string) => string
type CategoryName = (categoryId: string) => string

// The accounts an item names on screen; an anchor and a difference sit in their own account's feed
function accountIdsOf(item: FeedItem): string[] {
  switch (item.type) {
    case 'OPERATION':
      return [item.accountId]
    case 'TRANSFER':
      return [item.source.accountId, item.target.accountId]
    default:
      return []
  }
}

// An account's small icon, on an operation's corner and in a transfer's pair alike
const accountBadge = 'absolute size-[22px] rounded-md border-2 border-card text-[8px]'

// A row's icon: what it is about, with an account badged on the corner
type Named = { id: string; name: string }

function RowAvatar({ main, badge }: { main: Named; badge?: Named }) {
  return (
    <span className="relative shrink-0">
      <InitialsAvatar name={main.name} colorId={main.id} />
      {badge && (
        <InitialsAvatar
          name={badge.name}
          colorId={badge.id}
          className={cn(accountBadge, '-right-1.5 -bottom-1.5')}
        />
      )}
    </span>
  )
}

// One tile split in two, source then target as the title reads, each half in its account's colour
function AccountPair({ source, target }: { source: Named; target: Named }) {
  const half =
    'flex flex-1 items-center justify-center bg-(--ws-soft) pb-1.5 text-[9px] font-extrabold text-(--ws)'
  return (
    <span aria-hidden className="relative size-9 shrink-0">
      <span className="flex size-full gap-0.5 overflow-hidden rounded-[10px]">
        <span style={accentOf(source.id)} className={half}>
          {initials(source.name)}
        </span>
        <span style={accentOf(target.id)} className={half}>
          {initials(target.name)}
        </span>
      </span>
      <span className="absolute -bottom-1 left-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border bg-card text-foreground">
        <ArrowRight className="size-2.5" strokeWidth={3} />
      </span>
    </span>
  )
}

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-muted-foreground"
    >
      <Icon className="size-4" />
    </span>
  )
}

// The category leads. Across the workspace the account is a badge on its corner and named beside it;
// in an account's own feed the account goes without saying.
function OperationRow({
  item,
  categoryName,
  accountName,
  inOwnAccount,
}: {
  item: OperationItem
  categoryName: string
  accountName: string
  inOwnAccount: boolean
}) {
  const { t } = useTranslation()
  const detail = inOwnAccount
    ? item.comment
    : item.comment
      ? t('feed.accountAndComment', { account: accountName, comment: item.comment })
      : accountName

  return (
    <>
      <RowAvatar
        main={{ id: item.categoryId, name: categoryName }}
        badge={inOwnAccount ? undefined : { id: item.accountId, name: accountName }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{categoryName}</span>
        {detail && <span className="truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
      <span
        className={cn('text-[15px] font-bold whitespace-nowrap', item.kind === 'INCOME' && 'text-positive')}
      >
        {formatOperationAmount(item)}
      </span>
    </>
  )
}

function TransferAmount({ item }: { item: TransferItem }) {
  // An account's feed says which side the account is on and its own amount (§10.5)
  if ('side' in item) {
    const incoming = item.side === 'TARGET'
    const { currency } = incoming ? item.target : item.source
    return (
      <span className={cn('text-[15px] font-bold whitespace-nowrap', incoming && 'text-positive')}>
        {formatSignedMagnitude(item.amount, currency, incoming)}
      </span>
    )
  }
  // Across the workspace a transfer only moves money, so it has no sign
  return (
    <span className="flex flex-col items-end text-[15px] font-bold whitespace-nowrap">
      <span>{formatMoney(item.source.amount, item.source.currency)}</span>
      {!sameFigure(item.source, item.target) && (
        <span>{formatMoney(item.target.amount, item.target.currency)}</span>
      )}
    </span>
  )
}

const sameFigure = (source: TransferLeg, target: TransferLeg) =>
  source.currency === target.currency && source.amount === target.amount

function TransferRow({ item, accountName }: { item: TransferItem; accountName: AccountName }) {
  const { t } = useTranslation()
  return (
    <>
      <AccountPair
        source={{ id: item.source.accountId, name: accountName(item.source.accountId) }}
        target={{ id: item.target.accountId, name: accountName(item.target.accountId) }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">
          {t('feed.fromTo', {
            source: accountName(item.source.accountId),
            target: accountName(item.target.accountId),
          })}
        </span>
        {!sameFigure(item.source, item.target) && (
          <span className="truncate text-xs text-muted-foreground">
            {t('feed.rate', { rate: formatRate(item.rate) })}
          </span>
        )}
        {item.comment && <span className="truncate text-xs text-muted-foreground">{item.comment}</span>}
      </span>
      <TransferAmount item={item} />
    </>
  )
}

// A quiet second line, not an alarm: nothing has gone wrong that the reader can act on yet. The figure's
// sign says which way, measured against the previous anchor plus the operations since (§4.6).
function DifferenceNote({ item, currency }: { item: DifferenceItem; currency: string }) {
  const { t } = useTranslation()
  const figure = formatSignedMagnitude(Math.abs(item.amount), currency, item.amount > 0)
  return (
    // The arrows jump to the difference, so it keeps its own place to be found by
    <span
      data-cursor={item.cursor}
      className="truncate text-xs text-muted-foreground motion-safe:group-aria-[current=true]:animate-arrive-note"
    >
      {t('feed.difference', { amount: figure })}
    </span>
  )
}

function AnchorRow({
  value,
  difference,
  currency,
}: {
  value: number
  difference: DifferenceItem | undefined
  currency: string
}) {
  const { t } = useTranslation()
  return (
    <>
      <span className="relative shrink-0">
        <RowIcon icon={Pen} />
        {difference && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-warning text-[10px] font-extrabold text-white"
          >
            !
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{t('feed.anchor')}</span>
        {difference && <DifferenceNote item={difference} currency={currency} />}
      </span>
      <span className="text-[15px] font-bold whitespace-nowrap">{formatMoney(value, currency)}</span>
    </>
  )
}

function FeedRow({
  item,
  difference,
  account,
  accountName,
  categoryName,
}: {
  item: FeedItem
  // The next item, when it is this anchor's difference
  difference: DifferenceItem | undefined
  account: Account | undefined
  accountName: AccountName
  categoryName: CategoryName
}) {
  switch (item.type) {
    case 'OPERATION':
      return (
        <OperationRow
          item={item}
          categoryName={categoryName(item.categoryId)}
          accountName={accountName(item.accountId)}
          inOwnAccount={account !== undefined}
        />
      )
    case 'TRANSFER':
      return <TransferRow item={item} accountName={accountName} />
    // Only an account's feed has these two, and they carry no currency: it is always the account's own
    case 'BALANCE_ANCHOR':
      return account && <AnchorRow value={item.value} difference={difference} currency={account.currency} />
    case 'DIFFERENCE':
      // On its own only until its anchor's page arrives, lined up with the text of the rows around it
      return (
        account && (
          <span className="pl-12">
            <DifferenceNote item={item} currency={account.currency} />
          </span>
        )
      )
  }
}

// Consecutive operations of one category on one account. The total is summed here for showing only (runTotal).
function RunRows({
  items,
  categoryName,
  accountName,
  inOwnAccount,
  expanded,
  onToggle,
  edit,
  swipe,
}: {
  items: OperationItem[]
  categoryName: string
  accountName: string
  inOwnAccount: boolean
  expanded: boolean
  onToggle: () => void
  edit: (item: OperationItem) => (() => void) | undefined
  swipe: Swipe
}) {
  const { t } = useTranslation()
  const first = items[0]!
  const income = first.kind === 'INCOME'
  const members = items.slice(0, -1)

  return (
    <>
      {/* The oldest item's cursor stays with the run as newer ones join it or leave the window, and stays
          on this row when expanded, so opening a run moves nothing above it */}
      <li data-cursor={items.at(-1)!.cursor}>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center gap-3 py-2.5 text-left"
        >
          <RowAvatar
            main={{ id: first.categoryId, name: categoryName }}
            badge={inOwnAccount ? undefined : { id: first.accountId, name: accountName }}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{categoryName}</span>
            {/* Beside the count rather than after the amount, so amounts keep one right edge in every row */}
            <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate">
                {inOwnAccount
                  ? t('feed.run', { count: items.length })
                  : t('feed.runInAccount', { count: items.length, account: accountName })}
              </span>
              <ChevronDown
                aria-hidden
                className={cn('size-3.5 shrink-0 transition-transform', expanded && 'rotate-180')}
              />
            </span>
          </span>
          <span className={cn('text-[15px] font-bold whitespace-nowrap', income && 'text-positive')}>
            {formatSignedMagnitude(runTotal(items), first.currency, income)}
          </span>
        </button>
      </li>
      {expanded &&
        items.map((item) => {
          const onEdit = edit(item)
          const layout = 'flex min-h-10 w-full items-center gap-3 py-1.5 pl-12'
          const content = (
            <>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{item.comment}</span>
              <span className={cn('text-sm font-semibold whitespace-nowrap', income && 'text-positive')}>
                {formatOperationAmount(item)}
              </span>
            </>
          )
          return (
            <li
              key={item.cursor}
              data-cursor={members.includes(item) ? item.cursor : undefined}
              // A column only for an editable row, whose refusal message goes under it
              className={onEdit ? 'flex flex-col' : layout}
            >
              {onEdit ? (
                // The run's own indent, kept inside the row that reaches the card's edges
                <EditableRow
                  item={item}
                  onEdit={onEdit}
                  swipe={swipe}
                  className={cn(layout, 'pl-16 md:pl-17')}
                >
                  {content}
                </EditableRow>
              ) : (
                content
              )}
            </li>
          )
        })}
    </>
  )
}

// Rendered only while another page can be asked for, so each page's arrival mounts a new one: an
// observer fires once on start, which covers a page too short to fill the screen.
function PageTrigger({ onVisible }: { onVisible: () => unknown }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible()
        }
      },
      // Ahead of the reader, so the next page is there before the list runs out
      { rootMargin: '600px' },
    )
    observer.observe(ref.current!)
    return () => observer.disconnect()
  }, [onVisible])

  return <div ref={ref} aria-hidden />
}

// A failed page stops the loading and offers a retry, or the trigger would ask again forever
function FeedEdge({
  hasMore,
  isFetching,
  failure,
  fetchMore,
}: {
  hasMore: boolean
  isFetching: boolean
  failure: Error | null
  fetchMore: () => unknown
}) {
  const { t } = useTranslation()

  if (failure) {
    return <LoadError title={t('errors.loadFeed')} error={failure} onRetry={() => fetchMore()} />
  }
  if (isFetching) {
    return <Pending>{t('common.loading')}</Pending>
  }
  return hasMore ? <PageTrigger onVisible={fetchMore} /> : null
}

// Well past the first screen, so it does not come and go on a small scroll
const TO_NEWEST_FROM = 600

function ToNewest({ onClick }: { onClick: () => void }) {
  const [shown, setShown] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const update = () => setShown(window.scrollY > TO_NEWEST_FROM)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (!shown) {
    return null
  }
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t('feed.toNewest')}
      onClick={onClick}
      className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 size-11 rounded-full bg-card shadow-md md:right-8 md:bottom-8"
    >
      <ArrowUp aria-hidden />
    </Button>
  )
}

// What the feed needs of its query; both feeds' queries (use-feed.ts) answer in this shape
interface FeedQuery {
  data: { pages: { items: FeedItem[] }[] } | undefined
  error: Error | null
  refetch: () => unknown
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  isFetchNextPageError: boolean
  isFetchPreviousPageError: boolean
  fetchNextPage: () => unknown
  fetchPreviousPage: () => unknown
}

// The window of pages Core answered, under their days, growing at whichever end the reader nears.
// Core has ordered the items, so a day's are always adjacent; the day is the floating value's own
// date, never derived through a time zone.
function FeedList({
  feed,
  items,
  account,
  accountName,
  categoryName,
  focus,
  toHead,
  edit,
  editTransfer,
  swipe,
}: {
  feed: FeedQuery
  items: FeedItem[]
  account: Account | undefined
  accountName: AccountName
  categoryName: CategoryName
  focus: string | undefined
  toHead: () => void
  // Opens the operation in the form; undefined for one that cannot be edited
  edit: (item: OperationItem) => (() => void) | undefined
  editTransfer: (item: TransferFeedItem) => (() => void) | undefined
  swipe: Swipe
}) {
  const { list, direction, setDirection } = useScrollAnchor(!feed.hasPreviousPage, focus)
  // Which runs are open, by every cursor in them, so a refetch or a new item joining leaves one open
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())

  const toggle = (run: OperationItem[], expanded: boolean) =>
    setOpen((current) => {
      const next = new Set(current)
      run.forEach((item) => (expanded ? next.delete(item.cursor) : next.add(item.cursor)))
      return next
    })

  const { fetchNextPage, fetchPreviousPage } = feed
  const fetchOlder = useCallback(() => {
    setDirection('down')
    return fetchNextPage()
  }, [fetchNextPage, setDirection])
  const fetchNewer = useCallback(() => {
    setDirection('up')
    return fetchPreviousPage()
  }, [fetchPreviousPage, setDirection])

  const toNewest = () => {
    // Already holding the first page, scrolling is enough
    if (feed.hasPreviousPage || focus) {
      toHead()
    }
    window.scrollTo(0, 0)
  }

  const days: { day: string; items: FeedItem[] }[] = []
  for (const item of items) {
    const day = item.occurredAt.slice(0, 10)
    if (days.at(-1)?.day !== day) {
      days.push({ day, items: [] })
    }
    days.at(-1)!.items.push(item)
  }

  return (
    <div ref={list} className="flex flex-col gap-6 [overflow-anchor:none]">
      <FeedEdge
        // Only the way the reader is going: collapsed runs can leave the window shorter than the screen,
        // where both ends would load in turn, each dropping the page the other just fetched, forever
        hasMore={feed.hasPreviousPage && direction !== 'down'}
        isFetching={feed.isFetchingPreviousPage}
        failure={feed.isFetchPreviousPageError ? feed.error : null}
        fetchMore={fetchNewer}
      />
      {days.map(({ day, items: ofDay }, index) => (
        <section key={day} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-[13px] font-bold text-muted-foreground">{formatFeedDay(day)}</h2>
            {/* A day cut by the window's edge would show too little, so it shows nothing until it is whole */}
            {!(index === 0 && feed.hasPreviousPage) && !(index === days.length - 1 && feed.hasNextPage) && (
              <span className="flex gap-2 text-xs text-muted-foreground">
                {dayTotals(ofDay).map(({ currency, amount }) => (
                  <span key={currency}>{formatSignedMagnitude(Math.abs(amount), currency, amount >= 0)}</span>
                ))}
              </span>
            )}
          </div>
          <ul className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card px-4 md:px-5">
            {feedRows(ofDay).map((row) => {
              if (row.kind === 'RUN') {
                const expanded = row.items.some((item) => open.has(item.cursor))
                return (
                  <RunRows
                    key={row.items.at(-1)!.cursor}
                    items={row.items}
                    categoryName={categoryName(row.items[0]!.categoryId)}
                    accountName={accountName(row.items[0]!.accountId)}
                    inOwnAccount={account !== undefined}
                    expanded={expanded}
                    onToggle={() => toggle(row.items, expanded)}
                    edit={edit}
                    swipe={swipe}
                  />
                )
              }
              const { item, difference } = row
              const current = focus !== undefined && (item.cursor === focus || difference?.cursor === focus)
              const onEdit =
                item.type === 'OPERATION'
                  ? edit(item)
                  : item.type === 'TRANSFER'
                    ? editTransfer(item)
                    : undefined
              const content = (
                <FeedRow
                  item={item}
                  difference={difference}
                  account={account}
                  accountName={accountName}
                  categoryName={categoryName}
                />
              )
              return (
                <li
                  key={item.cursor}
                  data-cursor={item.cursor}
                  aria-current={current || undefined}
                  className={cn(
                    'group aria-[current=true]:-mx-4 aria-[current=true]:px-4 motion-safe:aria-[current=true]:animate-arrive-row md:aria-[current=true]:-mx-5 md:aria-[current=true]:px-5',
                    // A column only for an editable row, whose refusal message goes under it
                    onEdit ? 'flex flex-col' : rowLayout,
                  )}
                >
                  {(item.type === 'OPERATION' || item.type === 'TRANSFER') && onEdit ? (
                    <EditableRow item={item} onEdit={onEdit} swipe={swipe} className={rowLayout}>
                      {content}
                    </EditableRow>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <FeedEdge
        hasMore={feed.hasNextPage && direction !== 'up'}
        isFetching={feed.isFetchingNextPage}
        failure={feed.isFetchNextPageError ? feed.error : null}
        fetchMore={fetchOlder}
      />
      <ToNewest onClick={toNewest} />
    </div>
  )
}

// The one feed component, whichever feed it shows: `account` says it is that account's, and `focus` is
// the item jumped to, brought to the middle of the screen and marked.
export function Feed({
  workspaceId,
  feed,
  account,
  focus,
  toHead,
}: {
  workspaceId: string
  feed: FeedQuery
  account?: Account
  focus?: string
  toHead: () => void
}) {
  const accounts = useAccounts(workspaceId)
  const categories = useCategories(workspaceId)
  const workspace = useWorkspace(workspaceId)
  const { t } = useTranslation()
  // The operation open in the form, if any: to edit it, or to make a new one from it
  const [inForm, setInForm] = useState<{ item: OperationItem; repeat: boolean }>()
  const [transferInForm, setTransferInForm] = useState<{ item: TransferFeedItem; repeat: boolean }>()
  // A swipe's delete: a refused one brings its row back with Core's word under it. A new swipe clears the last
  // refusal first, in the same update that slides its row away, or that row would come straight back.
  const cancel = useCancelOperation(workspaceId)
  const cancelTransfer = useCancelTransfer(workspaceId)
  const [failure, setFailure] = useState<Swipe['failure']>()
  const swipe: Swipe = {
    remove: (item) => {
      setFailure(undefined)
      const removal = item.type === 'TRANSFER' ? cancelTransfer : cancel
      removal.mutate(item.id, { onError: (error) => setFailure({ id: item.id, message: error.message }) })
    },
    repeat: (item) =>
      item.type === 'TRANSFER'
        ? setTransferInForm({ item, repeat: true })
        : setInForm({ item, repeat: true }),
    failure,
  }

  const items = feed.data ? feed.data.pages.flatMap((page) => page.items) : []
  const accountNames = new Map(accounts.data?.map((each) => [each.id, each.name]))
  const categoryNames = new Map(categories.data?.map((each) => [each.id, each.name]))
  const accountMissing =
    accounts.data !== undefined &&
    items.some((item) => accountIdsOf(item).some((id) => !accountNames.has(id)))
  const categoryMissing =
    categories.data !== undefined &&
    items.some((item) => item.type === 'OPERATION' && !categoryNames.has(item.categoryId))

  // One made in another tab can reach the feed before its list; neither is ever deleted, so one re-read finds it
  const refetchAccounts = accounts.refetch
  const refetchCategories = categories.refetch
  useEffect(() => {
    if (accountMissing) void refetchAccounts()
  }, [accountMissing, refetchAccounts])
  useEffect(() => {
    if (categoryMissing) void refetchCategories()
  }, [categoryMissing, refetchCategories])

  // Once a page is on screen, a failure elsewhere must not replace it: FeedEdge reports a later page's
  if (accounts.error && !accounts.data) {
    return (
      <LoadError title={t('errors.loadAccounts')} error={accounts.error} onRetry={() => accounts.refetch()} />
    )
  }
  if (categories.error && !categories.data) {
    return (
      <LoadError
        title={t('errors.loadCategories')}
        error={categories.error}
        onRetry={() => categories.refetch()}
      />
    )
  }
  if (feed.error && !feed.data) {
    return <LoadError title={t('errors.loadFeed')} error={feed.error} onRetry={() => feed.refetch()} />
  }
  if (!feed.data || !accounts.data || !categories.data) {
    return <Pending>{t('common.loading')}</Pending>
  }

  if (items.length === 0) {
    return <Pending>{t('feed.empty')}</Pending>
  }

  const accountName = (accountId: string) => accountNames.get(accountId) ?? t('feed.pendingName')
  const categoryName = (categoryId: string) => categoryNames.get(categoryId) ?? t('feed.pendingName')

  // Core takes no write to a read-only workspace nor to an archived account, so neither offers its rows.
  const archived = new Set(accounts.data.filter((each) => each.archived).map((each) => each.id))
  const edit = (item: OperationItem) =>
    workspace && isWritable(workspace) && !archived.has(item.accountId)
      ? () => setInForm({ item, repeat: false })
      : undefined
  const editTransfer = (item: TransferFeedItem) =>
    workspace &&
    isWritable(workspace) &&
    !archived.has(item.source.accountId) &&
    !archived.has(item.target.accountId)
      ? () => setTransferInForm({ item, repeat: false })
      : undefined

  return (
    <>
      <FeedList
        feed={feed}
        items={items}
        account={account}
        accountName={accountName}
        categoryName={categoryName}
        focus={focus}
        toHead={toHead}
        edit={edit}
        editTransfer={editTransfer}
        swipe={swipe}
      />
      {workspace && transferInForm && (
        <OperationDialog
          key={`${transferInForm.item.id}-${transferInForm.repeat}`}
          workspace={workspace}
          transfer={transferInForm.repeat ? undefined : transferInForm.item}
          transferTemplate={transferInForm.repeat ? transferInForm.item : undefined}
          open
          onClose={() => setTransferInForm(undefined)}
        />
      )}
      {/* One dialog for the feed, not one per row; keyed by the operation and the mode, so each opening starts
          its form afresh */}
      {workspace && inForm && (
        <OperationDialog
          key={`${inForm.item.id}-${inForm.repeat}`}
          workspace={workspace}
          accountId={account?.id}
          operation={inForm.repeat ? undefined : inForm.item}
          template={inForm.repeat ? inForm.item : undefined}
          open
          onClose={() => setInForm(undefined)}
        />
      )}
    </>
  )
}

import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Command, CommandEmpty, CommandInput, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useMediaQuery, WIDE } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

// The pieces the account and category pickers share: a field that opens a searchable list, the list in
// a bottom sheet on a phone and in a popover from md up.

// The field: what is chosen, and a chevron saying it opens
export function PickerTrigger({ className, children, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'flex h-12 w-full min-w-0 items-center gap-3 rounded-lg border border-input bg-card px-2 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm',
        className,
      )}
    >
      {children}
      <ChevronDown aria-hidden className="ml-auto size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function PickerPopup({
  title,
  open,
  onOpenChange,
  trigger,
  popoverClassName,
  children,
}: {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  popoverClassName?: string
  children: ReactNode
}) {
  return useMediaQuery(WIDE) ? (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className={cn('w-(--radix-popover-trigger-width) p-0', popoverClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  ) : (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      {/* No focus on the search at opening: the phone's keyboard would cover half the list */}
      <SheetContent
        side="bottom"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="max-h-[85dvh] gap-2 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}

// The recently used ones as one-tap chips in a scrolling row, closed by a chip opening the whole list
export function RecentChips<T extends { id: string; name: string }>({
  items,
  value,
  onChange,
  icon,
  allLabel,
  onAll,
}: {
  items: T[]
  value: string
  onChange: (id: string) => void
  icon: (item: T) => ReactNode
  allLabel: string
  onAll: () => void
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto p-1 [scrollbar-width:none]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={item.id === value}
          onClick={() => onChange(item.id)}
          className={cn(chip, 'pl-1.5')}
        >
          {icon(item)}
          {item.name}
        </button>
      ))}
      <button type="button" onClick={onAll} className={cn(chip, 'pl-3.5')}>
        {allLabel}
      </button>
    </div>
  )
}

const chip =
  'flex h-11 shrink-0 items-center gap-2 rounded-full border border-input bg-card pr-3.5 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-(--ws) aria-pressed:bg-(--ws) aria-pressed:text-white'

// Matches the words each row gives as keywords; a row's value is its id, which a search must never match
const byKeywords = (_value: string, search: string, keywords?: string[]) =>
  (keywords ?? []).join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) ? 1 : 0

// The searchable list; its rows are CommandItems with the id as value and the searchable words as keywords
export function PickerList({
  value,
  search,
  onSearch,
  placeholder,
  empty,
  children,
}: {
  value: string
  search: string
  onSearch: (search: string) => void
  placeholder: string
  empty: string
  children: ReactNode
}) {
  // The search takes focus only where no on-screen keyboard would cover the list
  const wide = useMediaQuery(WIDE)
  return (
    <Command filter={byKeywords} defaultValue={value} className="rounded-none bg-transparent">
      <CommandInput value={search} onValueChange={onSearch} placeholder={placeholder} autoFocus={wide} />
      <CommandList className="max-h-[60dvh] md:max-h-80">
        <CommandEmpty>{empty}</CommandEmpty>
        {children}
      </CommandList>
    </Command>
  )
}

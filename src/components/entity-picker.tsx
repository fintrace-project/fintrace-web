import type { ReactNode } from 'react'
import { Command, CommandEmpty, CommandInput, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useMediaQuery, WIDE } from '@/hooks/use-media-query'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

// The pieces the operation form's choices share: a pill that opens something, and a searchable list in a
// bottom sheet on a phone and in a popover from md up.

// A row of the searchable list's white card, on the tint when the keyboard or the pointer is on it
export const pickerRow = 'min-h-11 gap-3 data-selected:bg-(--ws-soft)'

export const pill =
  'inline-flex h-9 max-w-full min-w-0 items-center gap-1 rounded-full bg-card px-3.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-2 aria-invalid:ring-destructive [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground'

// `workspaceId` gives it the workspace's tint: portalled out of the dialog, it no longer inherits it
export function PickerPopup({
  workspaceId,
  title,
  open,
  onOpenChange,
  trigger,
  popoverClassName,
  children,
}: {
  workspaceId: string
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
      <PopoverContent
        align="start"
        style={accentOf(workspaceId)}
        className={cn('w-80 bg-(--ws-soft) p-0', popoverClassName)}
      >
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
        style={accentOf(workspaceId)}
        className="max-h-[85dvh] gap-2 rounded-t-2xl bg-(--ws-soft) pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}

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
    // On the popup's tint as the pages are: the search a white pill, the rows one white card. The search's frame
    // is drawn inside shadcn's CommandInput, so it is restyled from here through its data-slot.
    <Command
      filter={byKeywords}
      defaultValue={value}
      className="gap-2 bg-transparent p-4 pt-0 md:p-2 **:data-[slot=command-input-wrapper]:p-0 **:data-[slot=input-group]:h-10! **:data-[slot=input-group]:rounded-full! **:data-[slot=input-group]:border-transparent **:data-[slot=input-group]:bg-card"
    >
      <CommandInput value={search} onValueChange={onSearch} placeholder={placeholder} autoFocus={wide} />
      <CommandList className="max-h-[60dvh] rounded-xl bg-card p-1 md:max-h-80">
        <CommandEmpty>{empty}</CommandEmpty>
        {children}
      </CommandList>
    </Command>
  )
}

import { LogOut, SlidersHorizontal, User, UserCog } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserProfile } from '@/core/api'
import { displayName, initials } from '@/core/format'
import { useCurrentUser } from '@/hooks/use-current-user'
import { accentOf } from '@/lib/accent'
import { cn } from '@/lib/utils'

function UserAvatar({ user, className }: { user: UserProfile | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      style={user && accentOf(user.id)}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        user ? 'bg-(--ws) text-white' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {user ? initials(displayName(user)) : <User className="size-4" />}
    </span>
  )
}

// The account's actions, shared by both entry points. Sign-out posts a form kept outside the menu,
// which unmounts as it closes: the item submits the form rather than containing it
function AccountMenu({
  user,
  align,
  side,
  children,
}: {
  user: UserProfile | undefined
  align: 'start' | 'end'
  side: 'top' | 'bottom'
  children: ReactNode
}) {
  const signOut = useRef<HTMLFormElement>(null)
  const { t } = useTranslation()

  return (
    <>
      <form ref={signOut} method="post" action="/auth/logout" hidden />
      <DropdownMenu>
        {children}
        <DropdownMenuContent align={align} side={side} className="w-60 rounded-xl p-1.5">
          {user && (
            <>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
                <span className="truncate text-sm font-semibold text-foreground">{displayName(user)}</span>
                <span className="truncate text-xs">{user.email ?? user.username}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild className="min-h-11 gap-2.5 px-2 md:min-h-9">
            <Link to="/preferences">
              <SlidersHorizontal aria-hidden />
              {t('account.preferences')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => signOut.current?.requestSubmit()}
            className="min-h-11 gap-2.5 px-2 md:min-h-9"
          >
            <LogOut aria-hidden />
            {t('account.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

// Desktop, at the sidebar's foot: who is signed in, and the account menu beside it
export function UserCard() {
  const user = useCurrentUser().data
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 px-1 py-1.5">
      <UserAvatar user={user} className="size-10 text-sm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">{user ? displayName(user) : '…'}</span>
        {user && (
          <span className="truncate text-xs text-muted-foreground">{user.email ?? user.username}</span>
        )}
      </span>
      <AccountMenu user={user} align="end" side="top">
        <DropdownMenuTrigger
          aria-label={t('account.settings')}
          title={t('account.settings')}
          className="flex size-11 items-center justify-center rounded-[10px] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground"
        >
          <UserCog className="size-5" aria-hidden />
        </DropdownMenuTrigger>
      </AccountMenu>
    </div>
  )
}

// Phone, in the top bar: the avatar, opening the same account menu
export function UserMenu() {
  const user = useCurrentUser().data
  const { t } = useTranslation()

  return (
    <AccountMenu user={user} align="end" side="bottom">
      <DropdownMenuTrigger
        aria-label={user ? t('account.signedInAs', { name: displayName(user) }) : t('account.account')}
        className="flex size-11 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserAvatar user={user} className="size-full text-sm" />
      </DropdownMenuTrigger>
    </AccountMenu>
  )
}

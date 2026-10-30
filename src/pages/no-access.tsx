import { LogOut, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Core's 403 to a signed-in caller without `fintrace:user`; the UI never reads roles itself (§7.4)
export function NoAccessPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <ShieldX className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-extrabold tracking-tight">No access</h1>
      <p className="text-muted-foreground">
        You are signed in, but this account has not been given access to fintrace. Ask whoever runs it to
        grant access, or sign out and use another account.
      </p>
      <form method="post" action="/auth/logout">
        <Button type="submit" className="h-11 w-full rounded-[10px] font-bold sm:w-auto">
          <LogOut aria-hidden />
          Sign out
        </Button>
      </form>
    </main>
  )
}

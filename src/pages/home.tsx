import { ArrowLeftRight, FileUp, LogIn, Wallet, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Feature {
  icon: LucideIcon
  title: string
  text: string
}

const features: Feature[] = [
  {
    icon: Wallet,
    title: 'Every account in one place',
    text: 'Balances computed from your own history, checked against the figures your bank shows.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Transfers that add up',
    text: 'Move money between accounts and currencies without counting it twice as income or expense.',
  },
  {
    icon: FileUp,
    title: 'Bring your history',
    text: 'Import an existing record into a fresh workspace and carry on from where you were.',
  },
]

export function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
        <span className="font-semibold tracking-tight">fintrace</span>
        {/* A plain link, not a router Link: sign-in is the BFF's route, a full page load. */}
        <Button asChild variant="ghost" className="ml-auto h-11 md:h-8">
          <a href="/auth/login">Sign in</a>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-12 md:py-24">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            Know where your money went, and where it is.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground md:text-lg">
            fintrace keeps your accounts, operations and transfers in one ledger, and works out every balance
            and total for you.
          </p>
          <Button asChild size="lg" className="mt-8 h-11 w-full px-5 md:w-auto">
            <a href="/auth/login">
              <LogIn aria-hidden />
              Sign in to fintrace
            </a>
          </Button>
        </section>

        <section aria-label="Features" className="grid gap-3 pb-12 md:grid-cols-3 md:gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border p-4">
              <feature.icon className="size-5 text-muted-foreground" aria-hidden />
              <h2 className="mt-3 font-medium">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground">fintrace</footer>
    </div>
  )
}

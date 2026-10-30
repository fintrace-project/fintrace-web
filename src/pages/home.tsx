import { ArrowLeftRight, FileUp, LogIn, Wallet, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface Feature {
  icon: LucideIcon
  // Its title and text, under home in en.yml
  key: 'accounts' | 'transfers' | 'history'
}

const features: Feature[] = [
  { icon: Wallet, key: 'accounts' },
  { icon: ArrowLeftRight, key: 'transfers' },
  { icon: FileUp, key: 'history' },
]

export function HomePage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
        <span className="font-semibold tracking-tight">{t('app.name')}</span>
        {/* A plain link, not a router Link: sign-in is the BFF's route, a full page load. */}
        <Button asChild variant="ghost" className="ml-auto h-11 md:h-8">
          <a href="/auth/login">{t('home.signIn')}</a>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-12 md:py-24">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
            {t('home.headline')}
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground md:text-lg">{t('home.lead')}</p>
          <Button asChild size="lg" className="mt-8 h-11 w-full px-5 md:w-auto">
            <a href="/auth/login">
              <LogIn aria-hidden />
              {t('home.signInTo')}
            </a>
          </Button>
        </section>

        <section aria-label={t('home.features')} className="grid gap-3 pb-12 md:grid-cols-3 md:gap-4">
          {features.map((feature) => (
            <div key={feature.key} className="rounded-lg border p-4">
              <feature.icon className="size-5 text-muted-foreground" aria-hidden />
              <h2 className="mt-3 font-medium">{t(`home.${feature.key}.title`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`home.${feature.key}.text`)}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground">
        {t('app.name')}
      </footer>
    </div>
  )
}

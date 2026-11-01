import { Cookie } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CookieConsent from 'react-cookie-consent'
import { Button } from '@/components/ui/button'

// Informs rather than asks: the cookies are strictly necessary, so there is nothing to consent to (§3.6).
// Its own styles off and `location="none"`, since the library sets `bottom: 0` inline otherwise.
export function CookieNotice() {
  const { t } = useTranslation()
  return (
    <CookieConsent
      cookieName="fintrace-cookie-notice"
      expires={365}
      location="none"
      disableStyles
      ButtonComponent={Button}
      buttonText={t('cookieNotice.dismiss')}
      ariaAcceptLabel={t('cookieNotice.dismiss')}
      customContainerAttributes={{ role: 'region', 'aria-label': t('cookieNotice.label') }}
      containerClasses="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-3 border-t bg-card px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md md:rounded-2xl md:border md:pb-4"
      contentClasses="flex min-w-0 flex-1 items-center gap-4"
      buttonWrapperClasses="w-full md:w-auto"
      buttonClasses="h-11 w-full rounded-[10px] px-4 font-bold md:h-9 md:w-auto"
    >
      <Cookie className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-sm">{t('cookieNotice.text')}</p>
    </CookieConsent>
  )
}

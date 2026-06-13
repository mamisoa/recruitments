import { Link, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useHealth } from '@/lib/queries'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr'
  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      {(['fr', 'en'] as const).map((l) => (
        <Button
          key={l}
          size="sm"
          variant={lang === l ? 'default' : 'ghost'}
          className="h-7 px-2 text-xs uppercase"
          onClick={() => void i18n.changeLanguage(l)}
        >
          {l}
        </Button>
      ))}
    </div>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { data: health } = useHealth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex flex-col">
            <span className="text-lg font-semibold leading-tight">{t('app.title')}</span>
            <span className="text-xs text-muted-foreground">{t('app.subtitle')}</span>
          </Link>
          <div className="flex items-center gap-3">
            {health && !health.ai_enabled && (
              <span className="hidden text-xs text-destructive sm:inline">
                {t('common.aiDisabled')}
              </span>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Building2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHealth } from '@/lib/queries'
import { cn } from '@/lib/utils'

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const LANGS = ['fr', 'en', 'et', 'de', 'nl'] as const
  const current = i18n.language?.split('-')[0] ?? 'fr'
  const lang = (LANGS as readonly string[]).includes(current) ? current : 'fr'
  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      {LANGS.map((l) => (
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

function SidebarLink({
  to,
  step,
  icon,
  label,
  // Positions section stays active on /positions/:id detail pages too.
  matchPrefix,
}: {
  to: string
  step: string
  icon: React.ReactNode
  label: string
  matchPrefix?: string
}) {
  const { pathname } = useLocation()
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const active =
          isActive || (matchPrefix ? pathname.startsWith(matchPrefix) : false)
        return cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        )
      }}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
        {step}
      </span>
      {icon}
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { data: health } = useHealth()

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <aside className="border-b md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:self-start md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-4 p-4">
          <Link to="/" className="flex flex-col">
            <span className="text-lg font-semibold leading-tight">{t('app.title')}</span>
            <span className="text-xs text-muted-foreground">{t('app.subtitle')}</span>
          </Link>

          <nav className="flex gap-2 md:flex-col">
            <SidebarLink
              to="/company"
              step="1"
              icon={<Building2 className="size-4 shrink-0" />}
              label={t('nav.company')}
            />
            <SidebarLink
              to="/positions"
              step="2"
              icon={<Briefcase className="size-4 shrink-0" />}
              label={t('nav.positions')}
              matchPrefix="/positions"
            />
          </nav>

          {health && !health.ai_enabled && (
            <div className="mt-auto">
              <span className="text-xs text-destructive">{t('common.aiDisabled')}</span>
            </div>
          )}
        </div>
      </aside>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

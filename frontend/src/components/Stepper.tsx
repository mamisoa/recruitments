import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type StepKey = 'position' | 'candidate' | 'interview'

interface Step {
  key: StepKey
  to: string | null
}

export function Stepper({ current, steps }: { current: StepKey; steps: Step[] }) {
  const { t } = useTranslation()
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, i) => {
        const active = step.key === current
        const label = t(`steps.${step.key}`)
        const content = (
          <span
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : step.to
                  ? 'bg-muted text-muted-foreground hover:bg-accent'
                  : 'bg-muted text-muted-foreground/50',
            )}
          >
            {label}
          </span>
        )
        return (
          <div key={step.key} className="flex items-center gap-2">
            {step.to && !active ? <Link to={step.to}>{content}</Link> : content}
            {i < steps.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        )
      })}
    </nav>
  )
}

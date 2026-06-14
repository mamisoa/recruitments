import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import type { ScoreWeights } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CRITERIA } from '@/components/interview/criteria'
import { DEFAULT_WEIGHTS } from './score'

const KEYS: { key: keyof ScoreWeights; labelKey: string }[] = [
  ...CRITERIA.map((c) => ({
    key: c.key as keyof ScoreWeights,
    labelKey: `interview.criteria.${c.key}`,
  })),
  { key: 'custom', labelKey: 'interview.customEvaluations' },
]

/** Live editor for the per-position global-score weights (0–3, step 0.5). */
export function WeightsPanel({
  weights,
  onChange,
  onSave,
  onReset,
  saving,
  dirty,
}: {
  weights: ScoreWeights
  onChange: (next: ScoreWeights) => void
  onSave: () => void
  onReset: () => void
  saving: boolean
  dirty: boolean
}) {
  const { t } = useTranslation()

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('dashboard.weights')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('dashboard.weightsHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {KEYS.map(({ key, labelKey }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t(labelKey)}</Label>
                <span className="font-mono text-sm tabular-nums">
                  ×{(weights[key] ?? 0).toFixed(1)}
                </span>
              </div>
              <Slider
                min={0}
                max={3}
                step={0.5}
                value={[weights[key] ?? 0]}
                onValueChange={(v) =>
                  onChange({ ...weights, [key]: Array.isArray(v) ? v[0] : v })
                }
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={saving || !dirty}>
            {t('dashboard.saveWeights')}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            disabled={
              JSON.stringify(weights) === JSON.stringify(DEFAULT_WEIGHTS)
            }
          >
            <RotateCcw className="size-4" />
            {t('dashboard.resetWeights')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

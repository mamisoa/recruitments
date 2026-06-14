import { useTranslation } from 'react-i18next'
import type { CustomEvaluation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CRITERIA, type State } from './criteria'
import { CustomEvaluations } from './CustomEvaluations'

/** Scored criteria + custom evaluations + free-text expectations. */
export function InterviewScoresCard({
  state,
  set,
  evaluations,
  onAddEvaluation,
  onUpdateEvaluation,
  onRemoveEvaluation,
  onSave,
  saving,
}: {
  state: State
  set: (patch: State) => void
  evaluations: CustomEvaluation[]
  onAddEvaluation: () => void
  onUpdateEvaluation: (index: number, patch: Partial<CustomEvaluation>) => void
  onRemoveEvaluation: (index: number) => void
  onSave: () => void
  saving: boolean
}) {
  const { t } = useTranslation()

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('interview.scores')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {CRITERIA.map(({ key, score, note }) => {
          const value = (state[score] as number | null) ?? 0
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t(`interview.criteria.${key}`)}</Label>
                <span className="font-mono text-sm tabular-nums">{value}/10</span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[value]}
                onValueChange={(v) =>
                  set({ [score]: Array.isArray(v) ? v[0] : v } as State)
                }
              />
              <Textarea
                rows={2}
                placeholder={t('interview.notePlaceholder')}
                value={(state[note] as string | null) ?? ''}
                onChange={(e) => set({ [note]: e.target.value } as State)}
              />
            </div>
          )
        })}

        <CustomEvaluations
          evaluations={evaluations}
          onAdd={onAddEvaluation}
          onUpdate={onUpdateEvaluation}
          onRemove={onRemoveEvaluation}
        />

        <div className="space-y-2">
          <Label>{t('interview.attentes')}</Label>
          <Textarea
            rows={3}
            placeholder={t('interview.attentesPlaceholder')}
            value={state.attentes_candidat ?? ''}
            onChange={(e) => set({ attentes_candidat: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('interview.specificites')}</Label>
          <Textarea
            rows={3}
            placeholder={t('interview.specificitesPlaceholder')}
            value={state.specificites_candidat ?? ''}
            onChange={(e) => set({ specificites_candidat: e.target.value })}
          />
        </div>

        <Button onClick={onSave} disabled={saving}>
          {t('interview.save')}
        </Button>
      </CardContent>
    </Card>
  )
}

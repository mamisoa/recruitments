import { useTranslation } from 'react-i18next'
import type { CustomEvaluation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'

/** Free-form, user-defined interview evaluations (title + score + note). */
export function CustomEvaluations({
  evaluations,
  onAdd,
  onUpdate,
  onRemove,
}: {
  evaluations: CustomEvaluation[]
  onAdd: () => void
  onUpdate: (index: number, patch: Partial<CustomEvaluation>) => void
  onRemove: (index: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {t('interview.customEvaluations')}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          {t('interview.addEvaluation')}
        </Button>
      </div>
      {evaluations.map((evaluation, index) => {
        const value = evaluation.score ?? 0
        return (
          <div key={index} className="space-y-2 border-l-2 border-border pl-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('interview.evaluationTitlePlaceholder')}
                value={evaluation.title}
                onChange={(e) => onUpdate(index, { title: e.target.value })}
              />
              <span className="shrink-0 font-mono text-sm tabular-nums">
                {value}/10
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
              >
                {t('interview.removeEvaluation')}
              </Button>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[value]}
              onValueChange={(v) =>
                onUpdate(index, { score: Array.isArray(v) ? v[0] : v })
              }
            />
            <Textarea
              rows={2}
              placeholder={t('interview.notePlaceholder')}
              value={evaluation.note ?? ''}
              onChange={(e) => onUpdate(index, { note: e.target.value })}
            />
          </div>
        )
      })}
    </div>
  )
}

import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePosition, useCandidates, useHealth } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EditableMarkdown } from '@/components/EditableMarkdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePositionForm } from '@/components/position/usePositionForm'
import { CandidatesCard } from '@/components/position/CandidatesCard'

export function PositionDetail() {
  const { positionId } = useParams()
  const id = Number(positionId)
  const { t } = useTranslation()
  const { data: position, isLoading } = usePosition(id)
  const { data: candidates } = useCandidates(id)
  const { data: health } = useHealth()
  const { form, set, save, savePresentation, generate } = usePositionForm(id, position)

  if (isLoading || !position) return <p>{t('common.loading')}</p>

  return (
    <div>
      <Input
        className="mb-4 text-lg font-semibold"
        value={form.title ?? ''}
        placeholder={t('positions.titlePlaceholder')}
        onChange={(e) => set({ title: e.target.value })}
      />

      {/* Position configuration: source inputs + AI generation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('steps.position')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('position.jobSource')}</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.job_is_url ?? false}
                  onChange={(e) => set({ job_is_url: e.target.checked })}
                />
                {t('position.jobIsUrl')}
              </label>
            </div>
            <Textarea
              rows={form.job_is_url ? 1 : 4}
              value={form.job_source ?? ''}
              placeholder={t('position.jobSourceHint')}
              onChange={(e) => set({ job_source: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || !health?.ai_enabled}
            >
              {generate.isPending ? t('position.generating') : t('position.generate')}
            </Button>
            <Button
              variant="outline"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              {t('position.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job presentation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('position.jobPresentation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableMarkdown
            label={t('position.jobPresentation')}
            hideLabel
            value={form.job_presentation ?? ''}
            placeholder={t('position.presentationPlaceholder')}
            onSave={(v) => savePresentation.mutateAsync({ job_presentation: v })}
          />
        </CardContent>
      </Card>

      {/* Selection criteria */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('position.selectionCriteria')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableMarkdown
            label={t('position.selectionCriteria')}
            hideLabel
            value={form.selection_criteria ?? ''}
            placeholder={t('position.presentationPlaceholder')}
            onSave={(v) => savePresentation.mutateAsync({ selection_criteria: v })}
          />
        </CardContent>
      </Card>

      <CandidatesCard positionId={id} candidates={candidates} />
    </div>
  )
}

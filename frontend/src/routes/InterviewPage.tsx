import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { Interview } from '@/lib/types'
import { useInterviewSheet, useHealth, qk } from '@/lib/queries'
import { Stepper } from '@/components/Stepper'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Markdown } from '@/components/Markdown'

type ScoreKey = 'fluence' | 'professionnalisme' | 'competences' | 'langues'
const CRITERIA: { key: ScoreKey; score: keyof Interview; note: keyof Interview }[] = [
  { key: 'fluence', score: 'score_fluence', note: 'note_fluence' },
  {
    key: 'professionnalisme',
    score: 'score_professionnalisme',
    note: 'note_professionnalisme',
  },
  { key: 'competences', score: 'score_competences', note: 'note_competences' },
  { key: 'langues', score: 'score_langues', note: 'note_langues' },
]

type State = Partial<Interview>

export function InterviewPage() {
  const { candidateId } = useParams()
  const id = Number(candidateId)
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: sheet, isLoading } = useInterviewSheet(id)
  const { data: health } = useHealth()

  const [state, setState] = useState<State>({})
  const [editingSummary, setEditingSummary] = useState(false)
  useEffect(() => {
    if (sheet) setState(sheet.interview ?? {})
  }, [sheet])

  const set = (patch: State) => setState((s) => ({ ...s, ...patch }))

  const save = useMutation({
    mutationFn: () =>
      api.saveInterview(id, {
        score_fluence: state.score_fluence ?? null,
        note_fluence: state.note_fluence ?? null,
        score_professionnalisme: state.score_professionnalisme ?? null,
        note_professionnalisme: state.note_professionnalisme ?? null,
        score_competences: state.score_competences ?? null,
        note_competences: state.note_competences ?? null,
        score_langues: state.score_langues ?? null,
        note_langues: state.note_langues ?? null,
        attentes_candidat: state.attentes_candidat ?? null,
        interview_summary: state.interview_summary ?? null,
      }),
    onSuccess: (iv) => {
      set(iv)
      void queryClient.invalidateQueries({ queryKey: qk.sheet(id) })
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const generate = useMutation({
    mutationFn: async () => {
      await save.mutateAsync()
      return api.generateInterviewSummary(id)
    },
    onSuccess: (iv) => {
      set({ interview_summary: iv.interview_summary })
      void queryClient.invalidateQueries({ queryKey: qk.sheet(id) })
      toast.success(t('common.generated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading || !sheet) return <p>{t('common.loading')}</p>

  const { position, candidate } = sheet
  const hasSummary = !!state.interview_summary

  return (
    <div>
      <Stepper
        current="interview"
        steps={[
          { key: 'position', to: `/positions/${position.id}` },
          { key: 'candidate', to: `/candidates/${id}` },
          { key: 'interview', to: null },
        ]}
      />

      <h1 className="mb-4 text-2xl font-semibold">{t('interview.heading')}</h1>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('interview.context')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{position.title}</p>
            </div>
            {position.company_presentation && (
              <Markdown className="text-muted-foreground">
                {position.company_presentation}
              </Markdown>
            )}
            {position.job_presentation && (
              <Markdown className="text-muted-foreground">
                {position.job_presentation}
              </Markdown>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {t('interview.candidateFacts')}
              <Button
                render={<Link to={`/candidates/${id}`} />}
                size="sm"
                variant="outline"
              >
                {t('interview.editCandidate')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {candidate.prenom} {candidate.nom}
              {candidate.age != null && (
                <span className="text-muted-foreground">
                  {' '}
                  · {t('candidate.age')} {candidate.age}
                </span>
              )}
            </p>
            {candidate.profile_summary && (
              <Markdown className="text-muted-foreground">
                {candidate.profile_summary}
              </Markdown>
            )}
          </CardContent>
        </Card>
      </div>

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

          <div className="space-y-2">
            <Label>{t('interview.attentes')}</Label>
            <Textarea
              rows={3}
              placeholder={t('interview.attentesPlaceholder')}
              value={state.attentes_candidat ?? ''}
              onChange={(e) => set({ attentes_candidat: e.target.value })}
            />
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {t('interview.save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('interview.summary')}
            <div className="flex items-center gap-2">
              {hasSummary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSummary((v) => !v)}
                >
                  {editingSummary ? t('interview.preview') : t('interview.edit')}
                </Button>
              )}
              <Button
                onClick={() => generate.mutate()}
                disabled={generate.isPending || !health?.ai_enabled}
              >
                {generate.isPending
                  ? t('position.generating')
                  : hasSummary
                    ? t('interview.regenerate')
                    : t('interview.generateSummary')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasSummary && !editingSummary ? (
            <Markdown>{state.interview_summary as string}</Markdown>
          ) : (
            <Textarea
              rows={9}
              placeholder={t('interview.summaryPlaceholder')}
              value={state.interview_summary ?? ''}
              onChange={(e) => set({ interview_summary: e.target.value })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

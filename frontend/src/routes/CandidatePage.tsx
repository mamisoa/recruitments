import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { useCandidate, useHealth } from '@/lib/queries'
import { Stepper } from '@/components/Stepper'
import { Button } from '@/components/ui/button'
import { EditableMarkdown } from '@/components/EditableMarkdown'
import { Card, CardContent } from '@/components/ui/card'
import { useCandidateForm } from '@/components/candidate/useCandidateForm'
import { CandidateIdentityCard } from '@/components/candidate/CandidateIdentityCard'
import { CandidateCvCard } from '@/components/candidate/CandidateCvCard'

export function CandidatePage() {
  const { candidateId } = useParams()
  const id = Number(candidateId)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: candidate, isLoading } = useCandidate(id)
  const { data: health } = useHealth()
  const {
    form,
    proposed,
    save,
    upload,
    removeCv,
    extract,
    saveSummary,
    genSummary,
    acceptField,
    acceptAll,
  } = useCandidateForm(id, candidate)
  const { register, handleSubmit, watch, formState } = form

  if (isLoading || !candidate) return <p>{t('common.loading')}</p>

  const aiOff = !health?.ai_enabled

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))}>
      <Stepper
        current="candidate"
        steps={[
          { key: 'position', to: `/positions/${candidate.position_id}` },
          { key: 'candidate', to: null },
          { key: 'interview', to: `/candidates/${id}/interview` },
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t('candidate.heading')}
          {candidate.age != null && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              · {t('candidate.age')} {candidate.age}
            </span>
          )}
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/candidates/${id}/interview`)}
        >
          {t('candidate.goToInterview')} →
        </Button>
      </div>

      <CandidateIdentityCard register={register} errors={formState.errors} />

      <CandidateCvCard
        candidate={candidate}
        aiOff={aiOff}
        upload={upload}
        removeCv={removeCv}
        extract={extract}
        genSummary={genSummary}
        proposed={proposed}
        acceptField={acceptField}
        acceptAll={acceptAll}
        watch={watch}
      />

      <Card className="mb-6">
        <CardContent>
          <EditableMarkdown
            label={t('candidate.profileSummary')}
            value={watch('profile_summary') ?? ''}
            placeholder={t('candidate.summaryPlaceholder')}
            onSave={(v) => saveSummary.mutateAsync(v)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => {
            if (confirm(t('candidate.delete') + ' ?'))
              api
                .deleteCandidate(id)
                .then(() => navigate(`/positions/${candidate.position_id}`))
                .catch((e: Error) => toast.error(e.message))
          }}
        >
          {t('candidate.delete')}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {t('candidate.save')}
        </Button>
      </div>
    </form>
  )
}

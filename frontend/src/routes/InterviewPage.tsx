import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInterviewSheet, useCompany, useHealth } from '@/lib/queries'
import { Stepper } from '@/components/Stepper'
import { useInterviewForm } from '@/components/interview/useInterviewForm'
import { InterviewContextCards } from '@/components/interview/InterviewContextCards'
import { InterviewScoresCard } from '@/components/interview/InterviewScoresCard'
import { InterviewSummaryCard } from '@/components/interview/InterviewSummaryCard'

export function InterviewPage() {
  const { candidateId } = useParams()
  const id = Number(candidateId)
  const { t } = useTranslation()
  const { data: sheet, isLoading } = useInterviewSheet(id)
  const { data: company } = useCompany()
  const { data: health } = useHealth()
  const form = useInterviewForm(id, sheet)

  if (isLoading || !sheet) return <p>{t('common.loading')}</p>

  const { position, candidate } = sheet

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

      <InterviewContextCards
        id={id}
        position={position}
        candidate={candidate}
        company={company}
      />

      <InterviewScoresCard
        state={form.state}
        set={form.set}
        evaluations={form.evaluations}
        onAddEvaluation={form.addEvaluation}
        onUpdateEvaluation={form.updateEvaluation}
        onRemoveEvaluation={form.removeEvaluation}
        onSave={() => form.save.mutate()}
        saving={form.save.isPending}
      />

      <InterviewSummaryCard
        state={form.state}
        set={form.set}
        editing={form.editingSummary}
        onToggleEditing={() => form.setEditingSummary((v) => !v)}
        generate={form.generate}
        viewPrompt={form.viewPrompt}
        promptOpen={form.promptOpen}
        setPromptOpen={form.setPromptOpen}
        aiEnabled={!!health?.ai_enabled}
      />
    </div>
  )
}

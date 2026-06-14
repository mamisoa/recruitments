import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { Candidate, Company, Position } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Markdown } from '@/components/Markdown'

/** Top grid: position/company context + read-only candidate facts. */
export function InterviewContextCards({
  id,
  position,
  candidate,
  company,
}: {
  id: number
  position: Position
  candidate: Candidate
  company: Company | undefined
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('interview.context')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">{position.title}</p>
          </div>
          {company?.company_presentation && (
            <Markdown className="text-muted-foreground">
              {company.company_presentation}
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
          <p className="text-muted-foreground">
            {candidate.statut_marital && (
              <span>
                {t('candidate.statutMarital')}: {candidate.statut_marital}
              </span>
            )}
            {candidate.statut_marital && ' · '}
            {t('candidate.statutEtudiant')}:{' '}
            {candidate.statut_etudiant ? t('common.yes') : t('common.no')}
          </p>
          {candidate.profile_summary && (
            <Markdown className="text-muted-foreground">
              {candidate.profile_summary}
            </Markdown>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

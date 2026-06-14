import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePosition, useCandidateScores } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CandidateLeaderboard } from '@/components/dashboard/CandidateLeaderboard'
import { ComparisonPanel } from '@/components/dashboard/ComparisonPanel'
import { ScoreRadar } from '@/components/dashboard/ScoreRadar'

export function DashboardPage() {
  const { positionId } = useParams()
  const id = Number(positionId)
  const { t } = useTranslation()
  const { data: position } = usePosition(id)
  const { data: rows, isLoading } = useCandidateScores(id)
  // Up to two candidate ids selected for the side-by-side comparison.
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (cid: number) =>
    setSelected((s) =>
      s.includes(cid) ? s.filter((x) => x !== cid) : s.length >= 2 ? s : [...s, cid],
    )

  if (isLoading) return <p>{t('common.loading')}</p>

  const picked = (rows ?? []).filter((c) => selected.includes(c.id))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {t('dashboard.heading')}
          {position && (
            <span className="text-muted-foreground"> · {position.title}</span>
          )}
        </h1>
        <Button variant="outline" size="sm" render={<Link to={`/positions/${id}`} />}>
          {t('common.back')}
        </Button>
      </div>

      <CandidateLeaderboard
        rows={rows ?? []}
        selected={selected}
        onToggle={toggle}
      />

      {picked.length === 2 && <ComparisonPanel a={picked[0]} b={picked[1]} />}

      {picked.length === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('dashboard.radar')} · {picked[0].prenom} {picked[0].nom}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadar
              series={[
                {
                  name: `${picked[0].prenom} ${picked[0].nom}`,
                  interview: picked[0].interview,
                },
              ]}
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {t('dashboard.selectSecond')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

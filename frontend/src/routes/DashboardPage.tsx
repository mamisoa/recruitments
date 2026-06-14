import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { Position, ScoreWeights } from '@/lib/types'
import { qk, usePosition, useCandidateScores } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CandidateLeaderboard } from '@/components/dashboard/CandidateLeaderboard'
import { ComparisonPanel } from '@/components/dashboard/ComparisonPanel'
import { ScoreRadar } from '@/components/dashboard/ScoreRadar'
import { WeightsPanel } from '@/components/dashboard/WeightsPanel'
import { DEFAULT_WEIGHTS } from '@/components/dashboard/score'

export function DashboardPage() {
  const { positionId } = useParams()
  const id = Number(positionId)
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: position } = usePosition(id)
  const { data: rows, isLoading } = useCandidateScores(id)
  // Up to two candidate ids selected for the side-by-side comparison.
  const [selected, setSelected] = useState<number[]>([])

  // Editable weights, synced from the position when it (re)loads. Editing them
  // recomputes the ranking live; "Save" persists them on the position.
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS)
  const [synced, setSynced] = useState<Position>()
  if (position && position !== synced) {
    setSynced(position)
    setWeights({ ...DEFAULT_WEIGHTS, ...position.score_weights })
  }

  const saveWeights = useMutation({
    mutationFn: () => api.updatePosition(id, { score_weights: weights }),
    onSuccess: (p) => {
      setSynced(p)
      setWeights({ ...DEFAULT_WEIGHTS, ...p.score_weights })
      void queryClient.invalidateQueries({ queryKey: qk.position(id) })
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const dirty =
    !!position &&
    JSON.stringify(weights) !==
      JSON.stringify({ ...DEFAULT_WEIGHTS, ...position.score_weights })

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

      <WeightsPanel
        weights={weights}
        onChange={setWeights}
        onSave={() => saveWeights.mutate()}
        onReset={() => setWeights(DEFAULT_WEIGHTS)}
        saving={saveWeights.isPending}
        dirty={dirty}
      />

      <CandidateLeaderboard
        rows={rows ?? []}
        weights={weights}
        selected={selected}
        onToggle={toggle}
      />

      {picked.length === 2 && (
        <ComparisonPanel a={picked[0]} b={picked[1]} weights={weights} />
      )}

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

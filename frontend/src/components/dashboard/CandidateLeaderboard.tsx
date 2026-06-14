import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { CandidateScore } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CRITERIA } from '@/components/interview/criteria'
import {
  compositeScore,
  fmtScore,
  scoreTone,
  TONE_BADGE,
  TONE_BAR,
} from './score'

/** A 0-10 score as a thin colored bar with the numeric value beside it. */
function ScoreBar({ value, label }: { value: number | null; label: string }) {
  const tone = scoreTone(value)
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${fmtScore(value)}/10`}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <span
          className={cn('block h-full rounded-full', TONE_BAR[tone])}
          style={{ width: `${((value ?? 0) / 10) * 100}%` }}
        />
      </span>
      <span className="w-5 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
        {fmtScore(value)}
      </span>
    </div>
  )
}

/**
 * Ranked table of candidates by global score (marker 1). Rows are sortable by
 * selection (up to 2) for the side-by-side comparison.
 */
export function CandidateLeaderboard({
  rows,
  selected,
  onToggle,
}: {
  rows: CandidateScore[]
  selected: number[]
  onToggle: (id: number) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Sort by global score desc; candidates without scores fall to the bottom.
  const ranked = [...rows].sort((a, b) => {
    const sa = compositeScore(a.interview)
    const sb = compositeScore(b.interview)
    if (sa == null && sb == null) return 0
    if (sa == null) return 1
    if (sb == null) return -1
    return sb - sa
  })

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('dashboard.ranking')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranked.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('dashboard.empty')}</p>
        )}
        {ranked.map((c, i) => {
          const global = compositeScore(c.interview)
          const tone = scoreTone(global)
          const isSelected = selected.includes(c.id)
          const limitReached = selected.length >= 2 && !isSelected
          return (
            <div
              key={c.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-md border px-3 py-2',
                isSelected && 'border-primary bg-accent/40',
              )}
            >
              <input
                type="checkbox"
                className="size-4 shrink-0"
                checked={isSelected}
                disabled={limitReached}
                title={t('dashboard.selectToCompare')}
                onChange={() => onToggle(c.id)}
              />
              <span className="w-5 text-center font-mono text-sm text-muted-foreground">
                {global == null ? '—' : i + 1}
              </span>
              <Badge className={cn('font-mono tabular-nums', TONE_BADGE[tone])}>
                {fmtScore(global)}
              </Badge>
              <button
                className="min-w-32 flex-1 text-left text-sm font-medium hover:underline"
                onClick={() => navigate(`/candidates/${c.id}`)}
              >
                {c.prenom} {c.nom}
                {c.age != null && (
                  <span className="text-muted-foreground"> · {c.age}</span>
                )}
              </button>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {CRITERIA.map((crit) => (
                  <ScoreBar
                    key={crit.key}
                    label={t(`interview.criteria.${crit.key}`)}
                    value={(c.interview?.[crit.score] as number | null) ?? null}
                  />
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/candidates/${c.id}/interview`)}
              >
                {t('dashboard.openInterview')}
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

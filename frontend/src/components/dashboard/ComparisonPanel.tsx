import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CandidateScore } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Markdown } from '@/components/Markdown'
import { CRITERIA } from '@/components/interview/criteria'
import { ScoreRadar } from './ScoreRadar'
import {
  compositeScore,
  fmtScore,
  scoreTone,
  SERIES_COLORS,
  TONE_BADGE,
} from './score'
import { cn } from '@/lib/utils'

function fullName(c: CandidateScore) {
  return `${c.prenom} ${c.nom}`.trim()
}

/** One candidate's detail column: global badge, custom evals, notes, summary. */
function DetailColumn({ c, color }: { c: CandidateScore; color: string }) {
  const { t } = useTranslation()
  const global = compositeScore(c.interview)
  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
        <span className="font-medium">{fullName(c)}</span>
        <Badge className={cn('ml-auto font-mono tabular-nums', TONE_BADGE[scoreTone(global)])}>
          {fmtScore(global)}
        </Badge>
      </div>

      {c.interview?.custom_evaluations.length ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t('interview.customEvaluations')}
          </p>
          {c.interview.custom_evaluations.map((e, i) => (
            <div key={i} className="flex justify-between gap-2 text-sm">
              <span className="truncate">{e.title || '—'}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {fmtScore(e.score)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {c.interview?.interview_summary ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t('interview.summary')}
          </p>
          <Markdown>{c.interview.interview_summary}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('dashboard.noInterview')}</p>
      )}
    </div>
  )
}

/** Side-by-side comparison of two candidates (marker 3). */
export function ComparisonPanel({ a, b }: { a: CandidateScore; b: CandidateScore }) {
  const { t } = useTranslation()

  const series = [
    { name: fullName(a), interview: a.interview },
    { name: fullName(b), interview: b.interview },
  ]

  // Grouped bars per criterion + delta = |a − b| shown beneath each criterion.
  const barData = CRITERIA.map((crit) => {
    const va = (a.interview?.[crit.score] as number | null) ?? 0
    const vb = (b.interview?.[crit.score] as number | null) ?? 0
    return {
      criterion: t(`interview.criteria.${crit.key}`),
      a: va,
      b: vb,
      delta: Math.abs(va - vb),
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.comparison')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {t('dashboard.radar')}
            </p>
            <ScoreRadar series={series} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {t('dashboard.byCriterion')}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="criterion" tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value) => fmtScore(typeof value === 'number' ? value : null)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name={fullName(a)} dataKey="a" fill={SERIES_COLORS[0]} radius={2} />
                <Bar name={fullName(b)} dataKey="b" fill={SERIES_COLORS[1]} radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t pt-4 md:flex-row">
          <DetailColumn c={a} color={SERIES_COLORS[0]} />
          <DetailColumn c={b} color={SERIES_COLORS[1]} />
        </div>
      </CardContent>
    </Card>
  )
}

import { useTranslation } from 'react-i18next'
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { Interview } from '@/lib/types'
import { CRITERIA } from '@/components/interview/criteria'
import { SERIES_COLORS } from './score'

export interface RadarSeries {
  name: string
  interview: Interview | null
}

/** Spider chart of the 4 core criteria for 1 or 2 candidates (overlaid). */
export function ScoreRadar({ series }: { series: RadarSeries[] }) {
  const { t } = useTranslation()

  // One row per axis; one column per candidate series, keyed by index (s0, s1).
  const data = CRITERIA.map((c) => {
    const row: Record<string, string | number | null> = {
      criterion: t(`interview.criteria.${c.key}`),
    }
    series.forEach((s, i) => {
      row[`s${i}`] = s.interview ? (s.interview[c.score] as number | null) : null
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis
          dataKey="criterion"
          tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
        />
        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickCount={6} />
        {series.map((s, i) => (
          <Radar
            key={i}
            name={s.name}
            dataKey={`s${i}`}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            fill={SERIES_COLORS[i % SERIES_COLORS.length]}
            fillOpacity={series.length > 1 ? 0.25 : 0.4}
            connectNulls
          />
        ))}
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </RadarChart>
    </ResponsiveContainer>
  )
}

import type { Interview, ScoreWeights } from '@/lib/types'
import { CRITERIA } from '@/components/interview/criteria'

/** Neutral weights: every component counts equally. */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  fluence: 1,
  professionnalisme: 1,
  competences: 1,
  langues: 1,
  custom: 1,
}

/** The four core criterion score values of an interview (null-safe). */
export function coreScores(interview: Interview | null): (number | null)[] {
  if (!interview) return []
  return CRITERIA.map((c) => interview[c.score] as number | null)
}

/** Mean of the candidate's filled custom-eval scores, or null if none. */
function customMean(interview: Interview): number | null {
  const vals = interview.custom_evaluations
    .map((e) => e.score)
    .filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/**
 * Global score = weighted mean of the 4 core criteria plus the custom-evals
 * group (averaged first, then weighted once). Each weight only counts when its
 * component is actually scored, so missing scores never penalise a candidate.
 * Returns null when nothing scored (or all relevant weights are 0).
 */
export function compositeScore(
  interview: Interview | null,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): number | null {
  if (!interview) return null
  let sum = 0
  let wsum = 0
  for (const c of CRITERIA) {
    const value = interview[c.score] as number | null
    if (value == null) continue
    const w = weights[c.key] ?? 0
    sum += w * value
    wsum += w
  }
  const cm = customMean(interview)
  if (cm != null) {
    const w = weights.custom ?? 0
    sum += w * cm
    wsum += w
  }
  if (wsum === 0) return null
  return sum / wsum
}

export type ScoreTone = 'high' | 'mid' | 'low' | 'none'

/** Color tone for a 0-10 score: ≥7 high, 4–6.99 mid, <4 low, null none. */
export function scoreTone(value: number | null): ScoreTone {
  if (value == null) return 'none'
  if (value >= 7) return 'high'
  if (value >= 4) return 'mid'
  return 'low'
}

/** Tailwind classes for a score badge, keyed by tone. */
export const TONE_BADGE: Record<ScoreTone, string> = {
  high: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  mid: 'bg-amber-500/15 text-amber-700 dark:text-amber-500',
  low: 'bg-destructive/15 text-destructive',
  none: 'bg-muted text-muted-foreground',
}

/** Tailwind background class for a score bar fill, keyed by tone. */
export const TONE_BAR: Record<ScoreTone, string> = {
  high: 'bg-emerald-500',
  mid: 'bg-amber-500',
  low: 'bg-destructive',
  none: 'bg-muted-foreground/30',
}

/** Format a 0-10 score for display, e.g. "7.5" or "—". */
export function fmtScore(value: number | null): string {
  return value == null ? '—' : value.toFixed(1).replace(/\.0$/, '')
}

/** Two distinct, light/dark-friendly series colors for comparing 2 candidates. */
export const SERIES_COLORS = ['#6366f1', '#f59e0b'] as const

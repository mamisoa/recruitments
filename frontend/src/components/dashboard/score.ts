import type { Interview } from '@/lib/types'
import { CRITERIA } from '@/components/interview/criteria'

/** The four core criterion score values of an interview (null-safe). */
export function coreScores(interview: Interview | null): (number | null)[] {
  if (!interview) return []
  return CRITERIA.map((c) => interview[c.score] as number | null)
}

/**
 * Global score = mean of every filled 0-10 score: the 4 core criteria plus the
 * candidate's custom evaluations. Returns null when nothing has been scored.
 */
export function compositeScore(interview: Interview | null): number | null {
  if (!interview) return null
  const values = [
    ...coreScores(interview),
    ...interview.custom_evaluations.map((e) => e.score),
  ].filter((v): v is number => v != null)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
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

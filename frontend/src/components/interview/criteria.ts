import type { Interview } from '@/lib/types'

export type ScoreKey = 'fluence' | 'professionnalisme' | 'competences' | 'langues'

export const CRITERIA: {
  key: ScoreKey
  score: keyof Interview
  note: keyof Interview
}[] = [
  { key: 'fluence', score: 'score_fluence', note: 'note_fluence' },
  {
    key: 'professionnalisme',
    score: 'score_professionnalisme',
    note: 'note_professionnalisme',
  },
  { key: 'competences', score: 'score_competences', note: 'note_competences' },
  { key: 'langues', score: 'score_langues', note: 'note_langues' },
]

export type State = Partial<Interview>

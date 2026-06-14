import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { CustomEvaluation, InterviewSheet } from '@/lib/types'
import { qk } from '@/lib/queries'
import type { State } from './criteria'

/** State + mutations backing the interview sheet form. */
export function useInterviewForm(id: number, sheet: InterviewSheet | undefined) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [state, setState] = useState<State>({})
  const [editingSummary, setEditingSummary] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)

  // Sync server data into the editable form when the sheet (re)loads. Done
  // during render via a tracked previous value rather than in an effect.
  const [synced, setSynced] = useState(sheet)
  if (sheet && sheet !== synced) {
    setSynced(sheet)
    setState(sheet.interview ?? {})
  }

  const set = (patch: State) => setState((s) => ({ ...s, ...patch }))

  const evaluations = state.custom_evaluations ?? []
  const addEvaluation = () =>
    set({ custom_evaluations: [...evaluations, { title: '', score: 0, note: '' }] })
  const updateEvaluation = (index: number, patch: Partial<CustomEvaluation>) =>
    set({
      custom_evaluations: evaluations.map((e, i) =>
        i === index ? { ...e, ...patch } : e,
      ),
    })
  const removeEvaluation = (index: number) =>
    set({ custom_evaluations: evaluations.filter((_, i) => i !== index) })

  const save = useMutation({
    mutationFn: () =>
      api.saveInterview(id, {
        score_fluence: state.score_fluence ?? null,
        note_fluence: state.note_fluence ?? null,
        score_professionnalisme: state.score_professionnalisme ?? null,
        note_professionnalisme: state.note_professionnalisme ?? null,
        score_competences: state.score_competences ?? null,
        note_competences: state.note_competences ?? null,
        score_langues: state.score_langues ?? null,
        note_langues: state.note_langues ?? null,
        attentes_candidat: state.attentes_candidat ?? null,
        specificites_candidat: state.specificites_candidat ?? null,
        interview_summary: state.interview_summary ?? null,
        custom_evaluations: state.custom_evaluations ?? [],
      }),
    onSuccess: (iv) => {
      set(iv)
      void queryClient.invalidateQueries({ queryKey: qk.sheet(id) })
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const generate = useMutation({
    mutationFn: async () => {
      await save.mutateAsync()
      return api.generateInterviewSummary(id, i18n.language)
    },
    onSuccess: (iv) => {
      set({ interview_summary: iv.interview_summary })
      void queryClient.invalidateQueries({ queryKey: qk.sheet(id) })
      toast.success(t('common.generated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const viewPrompt = useMutation({
    mutationFn: () => api.getInterviewPrompt(id, i18n.language),
    onSuccess: () => setPromptOpen(true),
    onError: (e: Error) => toast.error(e.message),
  })

  return {
    state,
    set,
    evaluations,
    addEvaluation,
    updateEvaluation,
    removeEvaluation,
    editingSummary,
    setEditingSummary,
    promptOpen,
    setPromptOpen,
    save,
    generate,
    viewPrompt,
  }
}

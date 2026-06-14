import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { Position } from '@/lib/types'
import { qk } from '@/lib/queries'

/** Form state + mutations backing the position detail page. */
export function usePositionForm(id: number, position: Position | undefined) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  // Sync server data into the editable form when it (re)loads. Done during
  // render via a tracked previous value rather than in an effect.
  const [form, setForm] = useState<Partial<Position>>({})
  const [synced, setSynced] = useState(position)
  if (position && position !== synced) {
    setSynced(position)
    setForm(position)
  }

  const set = (patch: Partial<Position>) => setForm((f) => ({ ...f, ...patch }))

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: qk.position(id) })
    void queryClient.invalidateQueries({ queryKey: qk.positions })
  }

  const save = useMutation({
    mutationFn: () =>
      api.updatePosition(id, {
        title: form.title,
        job_source: form.job_source,
        job_is_url: form.job_is_url,
        job_presentation: form.job_presentation,
        selection_criteria: form.selection_criteria,
      }),
    onSuccess: (p) => {
      setForm(p)
      invalidate()
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const savePresentation = useMutation({
    mutationFn: (patch: Partial<Position>) => api.updatePosition(id, patch),
    onSuccess: (p) => {
      setForm(p)
      invalidate()
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const generate = useMutation({
    mutationFn: async () => {
      // Persist current inputs before generating so the backend uses them.
      await api.updatePosition(id, {
        job_source: form.job_source,
        job_is_url: form.job_is_url,
      })
      return api.generatePresentations(id, i18n.language)
    },
    onSuccess: (p) => {
      setForm(p)
      void queryClient.invalidateQueries({ queryKey: qk.position(id) })
      toast.success(t('common.generated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return { form, set, save, savePresentation, generate }
}

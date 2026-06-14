import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { CandidateDetail, CandidateIdentifiers } from '@/lib/types'
import { qk } from '@/lib/queries'
import { schema, type FormValues, IDENTIFIER_FIELDS } from './schema'

/** Form state + mutations backing the candidate detail page. */
export function useCandidateForm(id: number, candidate: CandidateDetail | undefined) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [proposed, setProposed] = useState<CandidateIdentifiers | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { statut_etudiant: false },
  })
  const { reset, setValue } = form

  useEffect(() => {
    if (candidate)
      reset({
        nom: candidate.nom ?? '',
        prenom: candidate.prenom ?? '',
        ddn: candidate.ddn ?? '',
        email: candidate.email ?? '',
        telephone: candidate.telephone ?? '',
        isikukood: candidate.isikukood ?? '',
        statut_marital: candidate.statut_marital ?? '',
        statut_etudiant: candidate.statut_etudiant ?? false,
        profile_summary: candidate.profile_summary ?? '',
      })
  }, [candidate, reset])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk.candidate(id) })
    if (candidate)
      void queryClient.invalidateQueries({
        queryKey: qk.candidates(candidate.position_id),
      })
  }

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      api.updateCandidate(id, {
        ...values,
        ddn: values.ddn || null,
        email: values.email || null,
        telephone: values.telephone || null,
        isikukood: values.isikukood || null,
        statut_marital: values.statut_marital || null,
      }),
    onSuccess: () => {
      refresh()
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const upload = useMutation({
    mutationFn: (files: File[]) => api.uploadCvs(id, files),
    onSuccess: () => {
      refresh()
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removeCv = useMutation({
    mutationFn: (cvId: number) => api.deleteCv(id, cvId),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  })

  const extract = useMutation({
    mutationFn: () => api.extractIdentifiers(id),
    onSuccess: (data) => setProposed(data),
    onError: (e: Error) => toast.error(e.message),
  })

  const saveSummary = useMutation({
    mutationFn: (profile_summary: string) =>
      api.updateCandidate(id, { profile_summary }),
    onSuccess: (c) => {
      setValue('profile_summary', c.profile_summary ?? '')
      refresh()
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const genSummary = useMutation({
    mutationFn: () => api.generateProfileSummary(id, i18n.language),
    onSuccess: (c) => {
      setValue('profile_summary', c.profile_summary ?? '', { shouldDirty: true })
      refresh()
      toast.success(t('common.generated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const acceptField = (field: keyof CandidateIdentifiers) => {
    const value = proposed?.[field]
    if (value != null) setValue(field as keyof FormValues, value, { shouldDirty: true })
  }
  const acceptAll = () => IDENTIFIER_FIELDS.forEach(acceptField)

  return {
    form,
    proposed,
    save,
    upload,
    removeCv,
    extract,
    saveSummary,
    genSummary,
    acceptField,
    acceptAll,
  }
}

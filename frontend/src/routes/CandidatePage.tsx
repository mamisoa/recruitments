import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { CandidateIdentifiers } from '@/lib/types'
import { useCandidate, useHealth, qk } from '@/lib/queries'
import { Stepper } from '@/components/Stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EditableMarkdown } from '@/components/EditableMarkdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const schema = z.object({
  nom: z.string(),
  prenom: z.string(),
  ddn: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional().or(z.literal('')),
  isikukood: z
    .string()
    .regex(/^\d{11}$/, 'isikukood = 11 digits')
    .optional()
    .or(z.literal('')),
  statut_marital: z.string().optional().or(z.literal('')),
  statut_etudiant: z.boolean(),
  profile_summary: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

const IDENTIFIER_FIELDS: (keyof CandidateIdentifiers)[] = [
  'nom',
  'prenom',
  'ddn',
  'email',
  'telephone',
  'isikukood',
]

export function CandidatePage() {
  const { candidateId } = useParams()
  const id = Number(candidateId)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: candidate, isLoading } = useCandidate(id)
  const { data: health } = useHealth()
  const [proposed, setProposed] = useState<CandidateIdentifiers | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { statut_etudiant: false },
  })
  const { register, handleSubmit, reset, setValue, watch, formState } = form

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
      void queryClient.invalidateQueries({ queryKey: qk.candidates(candidate.position_id) })
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
    mutationFn: (profile_summary: string) => api.updateCandidate(id, { profile_summary }),
    onSuccess: (c) => {
      setValue('profile_summary', c.profile_summary ?? '')
      refresh()
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const genSummary = useMutation({
    mutationFn: () => api.generateProfileSummary(id),
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

  if (isLoading || !candidate) return <p>{t('common.loading')}</p>

  const aiOff = !health?.ai_enabled

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))}>
      <Stepper
        current="candidate"
        steps={[
          { key: 'position', to: `/positions/${candidate.position_id}` },
          { key: 'candidate', to: null },
          { key: 'interview', to: `/candidates/${id}/interview` },
        ]}
      />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t('candidate.heading')}
          {candidate.age != null && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              · {t('candidate.age')} {candidate.age}
            </span>
          )}
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/candidates/${id}/interview`)}
        >
          {t('candidate.goToInterview')} →
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('candidate.heading')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t('candidate.prenom')}>
            <Input {...register('prenom')} />
          </Field>
          <Field label={t('candidate.nom')}>
            <Input {...register('nom')} />
          </Field>
          <Field label={t('candidate.ddn')}>
            <Input type="date" {...register('ddn')} />
          </Field>
          <Field label={t('candidate.email')} error={formState.errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label={t('candidate.telephone')}>
            <Input {...register('telephone')} />
          </Field>
          <Field
            label={t('candidate.isikukood')}
            error={formState.errors.isikukood?.message}
          >
            <Input {...register('isikukood')} />
          </Field>
          <Field label={t('candidate.statutMarital')}>
            <Input {...register('statut_marital')} />
          </Field>
          <Field label={t('candidate.statutEtudiant')}>
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" {...register('statut_etudiant')} />
              {t('candidate.isStudent')}
            </label>
          </Field>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('candidate.cvFiles')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            multiple
            accept=".pdf,.txt,application/pdf,text/plain"
            disabled={upload.isPending}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) upload.mutate(files)
              e.target.value = ''
            }}
          />
          {candidate.cv_files.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('candidate.noCvs')}</p>
          )}
          {candidate.cv_files.map((cv) => (
            <div
              key={cv.id}
              className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
            >
              <span className="truncate">{cv.original_name}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeCv.mutate(cv.id)}
              >
                ✕
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={aiOff || extract.isPending || candidate.cv_files.length === 0}
              onClick={() => extract.mutate()}
            >
              {extract.isPending ? t('candidate.reading') : t('candidate.readCvs')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={aiOff || genSummary.isPending || candidate.cv_files.length === 0}
              onClick={() => genSummary.mutate()}
            >
              {genSummary.isPending
                ? t('position.generating')
                : t('candidate.generateSummary')}
            </Button>
          </div>

          {proposed && (
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{t('candidate.proposed')}</p>
                <Button type="button" size="sm" onClick={acceptAll}>
                  {t('candidate.acceptAll')}
                </Button>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                {t('candidate.proposedHint')}
              </p>
              <div className="space-y-1.5">
                {IDENTIFIER_FIELDS.map((f) => {
                  const value = proposed[f]
                  if (value == null || value === '') return null
                  return (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{t(`candidate.${f}`)}</Badge>
                      <span className="flex-1 truncate">{String(value)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('candidate.current')}: {String(watch(f as keyof FormValues) ?? '—')}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => acceptField(f)}
                      >
                        {t('candidate.accept')}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <EditableMarkdown
            label={t('candidate.profileSummary')}
            value={watch('profile_summary') ?? ''}
            placeholder={t('candidate.summaryPlaceholder')}
            onSave={(v) => saveSummary.mutateAsync(v)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => {
            if (confirm(t('candidate.delete') + ' ?'))
              api
                .deleteCandidate(id)
                .then(() => navigate(`/positions/${candidate.position_id}`))
                .catch((e: Error) => toast.error(e.message))
          }}
        >
          {t('candidate.delete')}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {t('candidate.save')}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

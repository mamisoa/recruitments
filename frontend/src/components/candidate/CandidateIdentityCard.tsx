import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FormValues } from './schema'

/** Candidate identity fields (name, contact, marital/student status). */
export function CandidateIdentityCard({
  register,
  errors,
}: {
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
}) {
  const { t } = useTranslation()

  return (
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
        <Field label={t('candidate.email')} error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </Field>
        <Field label={t('candidate.telephone')}>
          <Input {...register('telephone')} />
        </Field>
        <Field label={t('candidate.isikukood')} error={errors.isikukood?.message}>
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

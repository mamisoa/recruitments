import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { Company } from '@/lib/types'
import { useCompany, useHealth, qk } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EditableMarkdown } from '@/components/EditableMarkdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CompanyPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: company, isLoading } = useCompany()
  const { data: health } = useHealth()

  const [form, setForm] = useState<Partial<Company>>({})
  useEffect(() => {
    if (company) setForm(company)
  }, [company])

  const set = (patch: Partial<Company>) => setForm((f) => ({ ...f, ...patch }))

  const save = useMutation({
    mutationFn: (patch: Partial<Company>) => api.updateCompany(patch),
    onSuccess: (c) => {
      setForm(c)
      void queryClient.invalidateQueries({ queryKey: qk.company })
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const generate = useMutation({
    mutationFn: async () => {
      // Persist current inputs before generating so the backend uses them.
      await api.updateCompany({ name: form.name, company_url: form.company_url })
      return api.generateCompany()
    },
    onSuccess: (c) => {
      setForm(c)
      void queryClient.invalidateQueries({ queryKey: qk.company })
      toast.success(t('common.generated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading || !company) return <p>{t('common.loading')}</p>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t('company.heading')}</h1>

      {/* Company source inputs + AI generation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('company.heading')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('company.name')}</Label>
            <Input
              value={form.name ?? ''}
              placeholder={t('company.namePlaceholder')}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('company.url')}</Label>
            <Input
              value={form.company_url ?? ''}
              placeholder={t('company.urlPlaceholder')}
              onChange={(e) => set({ company_url: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || !health?.ai_enabled}
            >
              {generate.isPending ? t('company.generating') : t('company.generate')}
            </Button>
            <Button
              variant="outline"
              onClick={() => save.mutate({ name: form.name, company_url: form.company_url })}
              disabled={save.isPending}
            >
              {t('company.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company presentation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('company.presentation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableMarkdown
            label={t('company.presentation')}
            hideLabel
            value={form.company_presentation ?? ''}
            placeholder={t('company.presentationPlaceholder')}
            onSave={(v) => save.mutateAsync({ company_presentation: v })}
          />
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { Position } from '@/lib/types'
import { usePosition, useCandidates, useHealth, qk } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EditableMarkdown } from '@/components/EditableMarkdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function PositionDetail() {
  const { positionId } = useParams()
  const id = Number(positionId)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: position, isLoading } = usePosition(id)
  const { data: candidates } = useCandidates(id)
  const { data: health } = useHealth()

  const [form, setForm] = useState<Partial<Position>>({})
  useEffect(() => {
    if (position) setForm(position)
  }, [position])

  const set = (patch: Partial<Position>) => setForm((f) => ({ ...f, ...patch }))

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
      void queryClient.invalidateQueries({ queryKey: qk.position(id) })
      void queryClient.invalidateQueries({ queryKey: qk.positions })
      toast.success(t('common.saved'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const savePresentation = useMutation({
    mutationFn: (patch: Partial<Position>) => api.updatePosition(id, patch),
    onSuccess: (p) => {
      setForm(p)
      void queryClient.invalidateQueries({ queryKey: qk.position(id) })
      void queryClient.invalidateQueries({ queryKey: qk.positions })
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
      return api.generatePresentations(id)
    },
    onSuccess: (p) => {
      setForm(p)
      void queryClient.invalidateQueries({ queryKey: qk.position(id) })
      toast.success(t('common.generated'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const [candName, setCandName] = useState({ prenom: '', nom: '' })
  const [candOpen, setCandOpen] = useState(false)
  const createCandidate = useMutation({
    mutationFn: () => api.createCandidate(id, candName),
    onSuccess: (c) => {
      void queryClient.invalidateQueries({ queryKey: qk.candidates(id) })
      setCandOpen(false)
      setCandName({ prenom: '', nom: '' })
      navigate(`/candidates/${c.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading || !position) return <p>{t('common.loading')}</p>

  return (
    <div>
      <Input
        className="mb-4 text-lg font-semibold"
        value={form.title ?? ''}
        placeholder={t('positions.titlePlaceholder')}
        onChange={(e) => set({ title: e.target.value })}
      />

      {/* Position configuration: source inputs + AI generation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('steps.position')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('position.jobSource')}</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.job_is_url ?? false}
                  onChange={(e) => set({ job_is_url: e.target.checked })}
                />
                {t('position.jobIsUrl')}
              </label>
            </div>
            <Textarea
              rows={form.job_is_url ? 1 : 4}
              value={form.job_source ?? ''}
              placeholder={t('position.jobSourceHint')}
              onChange={(e) => set({ job_source: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || !health?.ai_enabled}
            >
              {generate.isPending ? t('position.generating') : t('position.generate')}
            </Button>
            <Button
              variant="outline"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              {t('position.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job presentation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('position.jobPresentation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableMarkdown
            label={t('position.jobPresentation')}
            hideLabel
            value={form.job_presentation ?? ''}
            placeholder={t('position.presentationPlaceholder')}
            onSave={(v) => savePresentation.mutateAsync({ job_presentation: v })}
          />
        </CardContent>
      </Card>

      {/* Selection criteria */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('position.selectionCriteria')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableMarkdown
            label={t('position.selectionCriteria')}
            hideLabel
            value={form.selection_criteria ?? ''}
            placeholder={t('position.presentationPlaceholder')}
            onSave={(v) => savePresentation.mutateAsync({ selection_criteria: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t('position.candidatesHeading')}
            <Dialog open={candOpen} onOpenChange={setCandOpen}>
              <DialogTrigger
                render={<Button size="sm">{t('position.addCandidate')}</Button>}
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('position.addCandidate')}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t('candidate.prenom')}</Label>
                    <Input
                      value={candName.prenom}
                      onChange={(e) =>
                        setCandName((n) => ({ ...n, prenom: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('candidate.nom')}</Label>
                    <Input
                      value={candName.nom}
                      onChange={(e) =>
                        setCandName((n) => ({ ...n, nom: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => createCandidate.mutate()}
                    disabled={createCandidate.isPending}
                  >
                    {t('position.addCandidate')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {candidates?.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('positions.empty')}</p>
          )}
          {candidates?.map((c) => (
            <div
              key={c.id}
              className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 hover:bg-accent/40"
              onClick={() => navigate(`/candidates/${c.id}`)}
            >
              <span>
                {c.prenom} {c.nom}
                {c.age != null && (
                  <span className="text-muted-foreground"> · {c.age}</span>
                )}
              </span>
              <Button size="sm" variant="ghost">
                {t('positions.open')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

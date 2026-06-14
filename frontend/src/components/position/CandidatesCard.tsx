import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import type { Candidate } from '@/lib/types'
import { qk } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/** Candidate list for a position + "add candidate" dialog. */
export function CandidatesCard({
  positionId,
  candidates,
}: {
  positionId: number
  candidates: Candidate[] | undefined
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [candName, setCandName] = useState({ prenom: '', nom: '' })
  const [candOpen, setCandOpen] = useState(false)

  const createCandidate = useMutation({
    mutationFn: () => api.createCandidate(positionId, candName),
    onSuccess: (c) => {
      void queryClient.invalidateQueries({ queryKey: qk.candidates(positionId) })
      setCandOpen(false)
      setCandName({ prenom: '', nom: '' })
      navigate(`/candidates/${c.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {t('position.candidatesHeading')}
          <div className="flex items-center gap-2">
            {candidates && candidates.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                render={<Link to={`/positions/${positionId}/dashboard`} />}
              >
                <BarChart3 className="size-4" />
                {t('dashboard.open')}
              </Button>
            )}
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
          </div>
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
  )
}

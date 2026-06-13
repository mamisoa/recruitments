import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/lib/api'
import { usePositions, qk } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function PositionList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: positions, isLoading } = usePositions()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  const create = useMutation({
    mutationFn: () => api.createPosition({ title: title.trim() || 'Sans titre' }),
    onSuccess: (pos) => {
      void queryClient.invalidateQueries({ queryKey: qk.positions })
      setOpen(false)
      setTitle('')
      navigate(`/positions/${pos.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('positions.heading')}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>{t('positions.new')}</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('positions.new')}</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              placeholder={t('positions.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create.mutate()}
            />
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                {t('positions.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}

      {positions && positions.length === 0 && (
        <p className="text-muted-foreground">{t('positions.empty')}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {positions?.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer transition-colors hover:bg-accent/40"
            onClick={() => navigate(`/positions/${p.id}`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{p.title || '—'}</span>
                <Badge variant="secondary">
                  {p.candidate_count} {t('positions.candidates')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {t('positions.updated')}: {new Date(p.updated_at).toLocaleString()}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

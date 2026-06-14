import type { UseMutationResult } from '@tanstack/react-query'
import type { UseFormWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { CandidateDetail, CandidateIdentifiers } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type FormValues, IDENTIFIER_FIELDS } from './schema'

/** CV upload/list + AI identifier extraction with a proposed-values panel. */
export function CandidateCvCard({
  candidate,
  aiOff,
  upload,
  removeCv,
  extract,
  genSummary,
  proposed,
  acceptField,
  acceptAll,
  watch,
}: {
  candidate: CandidateDetail
  aiOff: boolean
  upload: UseMutationResult<unknown, Error, File[], unknown>
  removeCv: UseMutationResult<unknown, Error, number, unknown>
  extract: UseMutationResult<unknown, Error, void, unknown>
  genSummary: UseMutationResult<unknown, Error, void, unknown>
  proposed: CandidateIdentifiers | null
  acceptField: (field: keyof CandidateIdentifiers) => void
  acceptAll: () => void
  watch: UseFormWatch<FormValues>
}) {
  const { t } = useTranslation()
  const noCvs = candidate.cv_files.length === 0

  return (
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
        {noCvs && (
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
            disabled={aiOff || extract.isPending || noCvs}
            onClick={() => extract.mutate()}
          >
            {extract.isPending ? t('candidate.reading') : t('candidate.readCvs')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={aiOff || genSummary.isPending || noCvs}
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
                      {t('candidate.current')}:{' '}
                      {String(watch(f as keyof FormValues) ?? '—')}
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
  )
}

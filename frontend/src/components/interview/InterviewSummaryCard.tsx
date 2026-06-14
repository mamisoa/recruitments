import { useTranslation } from 'react-i18next'
import type { UseMutationResult } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Markdown } from '@/components/Markdown'
import type { State } from './criteria'

/** AI-generated interview summary: preview/edit, regenerate, view prompt. */
export function InterviewSummaryCard({
  state,
  set,
  editing,
  onToggleEditing,
  generate,
  viewPrompt,
  promptOpen,
  setPromptOpen,
  aiEnabled,
}: {
  state: State
  set: (patch: State) => void
  editing: boolean
  onToggleEditing: () => void
  generate: UseMutationResult<unknown, Error, void, unknown>
  viewPrompt: UseMutationResult<{ prompt: string }, Error, void, unknown>
  promptOpen: boolean
  setPromptOpen: (open: boolean) => void
  aiEnabled: boolean
}) {
  const { t } = useTranslation()
  const hasSummary = !!state.interview_summary

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('interview.summary')}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewPrompt.mutate()}
              disabled={viewPrompt.isPending}
            >
              {t('interview.viewPrompt')}
            </Button>
            {hasSummary && (
              <Button variant="outline" size="sm" onClick={onToggleEditing}>
                {editing ? t('interview.preview') : t('interview.edit')}
              </Button>
            )}
            <Button
              onClick={() => generate.mutate()}
              disabled={generate.isPending || !aiEnabled}
            >
              {generate.isPending
                ? t('position.generating')
                : hasSummary
                  ? t('interview.regenerate')
                  : t('interview.generateSummary')}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasSummary && !editing ? (
          <Markdown>{state.interview_summary as string}</Markdown>
        ) : (
          <Textarea
            rows={9}
            placeholder={t('interview.summaryPlaceholder')}
            value={state.interview_summary ?? ''}
            onChange={(e) => set({ interview_summary: e.target.value })}
          />
        )}
      </CardContent>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('interview.promptTitle')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <Markdown>{viewPrompt.data?.prompt ?? ''}</Markdown>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

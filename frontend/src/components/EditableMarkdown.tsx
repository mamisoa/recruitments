import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PencilIcon } from 'lucide-react'
import { Markdown } from '@/components/Markdown'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Displays a markdown-authored field as formatted HTML, with an "Edit" button
 * that opens a modal to edit and save the raw text.
 *
 * `onSave` persists the new value; the modal closes once it resolves.
 */
export function EditableMarkdown({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string
  value: string
  placeholder?: string
  onSave: (value: string) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const openModal = () => {
    setDraft(value)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(draft)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button size="sm" variant="ghost" onClick={openModal}>
          <PencilIcon />
          {t('common.edit')}
        </Button>
      </div>
      {value ? (
        <Markdown>{value}</Markdown>
      ) : (
        <p className="text-sm text-muted-foreground">{placeholder}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <Textarea
            className="max-h-[60vh] min-h-[12rem] flex-1"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {t('position.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

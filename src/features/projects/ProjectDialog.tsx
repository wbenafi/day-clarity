import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fieldClass,
  fieldLabelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/appStyles'
import type { Project } from '@/lib/types'
import { Check } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

export function ProjectDialog({
  isOpen,
  onClose,
  onSave,
  project,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  project: Project | null
}) {
  const [name, setName] = useState(project?.name ?? '')
  const [isSaving, setSaving] = useState(false)

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || isSaving) return

    setSaving(true)
    try {
      await onSave(name)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-[440px] rounded-lg bg-[var(--surface)] p-[26px] shadow-[0_30px_80px_rgba(37,37,37,0.2)] sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{project ? 'Rename project' : 'New project'}</DialogTitle>
          <DialogDescription className="sr-only">
            Enter a project name.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={(event) => void submitForm(event)}>
          <Label className={fieldLabelClass}>
            <span>Project name</span>
            <Input
              autoFocus
              className={fieldClass}
              onChange={(event) => setName(event.target.value)}
              placeholder="Work, Personal, Launch plan"
              required
              value={name}
            />
          </Label>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Button
              className={secondaryButtonClass}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className={primaryButtonClass}
              disabled={isSaving}
              type="submit"
            >
              <Check size={18} />
              {project ? 'Save name' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

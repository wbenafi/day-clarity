import { AppHeader } from '@/components/app/AppHeader'
import { ScreenHeader } from '@/components/app/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  createBoardSection,
  normalizeBoardSections,
  sectionColorStyle,
} from '@/lib/boardSections'
import {
  dangerButtonClass,
  fieldClass,
  fieldLabelClass,
  mainClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  softNoteClass,
  textareaClass,
} from '@/lib/appStyles'
import {
  archiveWorkItemsBySection,
  countWorkItemsBySection,
} from '@/lib/data'
import { cn } from '@/lib/utils'
import type { BoardSection, Project } from '@/lib/types'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Check, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'

type PendingSectionDelete = {
  affectedItems: number
  section: BoardSection
}

export function ProjectSettingsPage({
  onDeleteProject,
  onSaveProject,
  project,
}: {
  onDeleteProject: (project: Project) => Promise<void>
  onSaveProject: (project: Project) => Promise<Project>
  project: Project
}) {
  const [name, setName] = useState(project.name)
  const [sections, setSections] = useState(project.boardSections)
  const [isSaving, setSaving] = useState(false)
  const [isProjectDeleteOpen, setProjectDeleteOpen] = useState(false)
  const [pendingDelete, setPendingDelete] =
    useState<PendingSectionDelete | null>(null)
  const [status, setStatus] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveSettings(sections)
  }

  async function saveSettings(nextSections: BoardSection[]) {
    if (isSaving || !name.trim()) return

    setSaving(true)
    setStatus('')
    try {
      const updatedProject = await onSaveProject({
        ...project,
        name,
        boardSections: normalizeBoardSections(nextSections),
      })
      setName(updatedProject.name)
      setSections(updatedProject.boardSections)
      setStatus('Settings saved.')
    } finally {
      setSaving(false)
    }
  }

  function addSection() {
    setSections((currentSections) => [...currentSections, createBoardSection()])
  }

  function updateSection(
    sectionId: string,
    key: keyof Omit<BoardSection, 'id'>,
    value: string,
  ) {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId ? { ...section, [key]: value } : section,
      ),
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSections((currentSections) => {
      const activeIndex = currentSections.findIndex(
        (section) => section.id === active.id,
      )
      const overIndex = currentSections.findIndex(
        (section) => section.id === over.id,
      )
      if (activeIndex < 0 || overIndex < 0) {
        return currentSections
      }

      return arrayMove(currentSections, activeIndex, overIndex)
    })
  }

  async function requestSectionDelete(section: BoardSection) {
    if (sections.length <= 1 || isSaving) return
    if (!name.trim()) {
      setStatus('Project name is required before deleting sections.')
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const affectedItems = await countWorkItemsBySection(project.id, section.id)
      setPendingDelete({ affectedItems, section })
    } finally {
      setSaving(false)
    }
  }

  async function confirmSectionDelete() {
    if (!pendingDelete || isSaving) return

    const { affectedItems, section } = pendingDelete
    setSaving(true)
    setStatus('')
    try {
      if (affectedItems > 0) {
        await archiveWorkItemsBySection(project.id, section.id)
      }

      const nextSections = sections.filter(
        (candidate) => candidate.id !== section.id,
      )
      const updatedProject = await onSaveProject({
        ...project,
        name,
        boardSections: normalizeBoardSections(nextSections),
      })
      setName(updatedProject.name)
      setSections(updatedProject.boardSections)
      setPendingDelete(null)
      setStatus('Section deleted.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmProjectDelete() {
    if (isSaving) return

    setSaving(true)
    setStatus('')
    try {
      await onDeleteProject(project)
    } catch (error) {
      setSaving(false)
      throw error
    }
  }

  return (
    <main className={mainClass}>
      <AppHeader subtitle="Tune this project’s board so it matches the work." />

      <ScreenHeader
        backLabel="Back to today"
        backTo="/"
        title="Project settings"
        description="Customize the board sections for this project. Existing work keeps its section unless you delete that section."
      />

      <form className="grid gap-5" onSubmit={(event) => void submitForm(event)}>
        <Card className={cn(panelClass, 'grid gap-3.5 p-5')}>
          <div>
            <h2>Project</h2>
            <p className={cn(softNoteClass, 'mt-1')}>Name shown in the sidebar.</p>
          </div>
          <Label className={fieldLabelClass}>
            <span>Project name</span>
            <Input
              className={fieldClass}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </Label>
        </Card>

        <Card className={cn(panelClass, 'grid gap-4 p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2>Board sections</h2>
              <p className={cn(softNoteClass, 'mt-1')}>
                Add, rename, recolor, remove, or reorder the columns on Today.
              </p>
            </div>
            <Button
              className={secondaryButtonClass}
              onClick={addSection}
              type="button"
              variant="outline"
            >
              <Plus size={17} />
              Add section
            </Button>
          </div>

          <TooltipProvider>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={sections.map((section) => section.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  {sections.map((section) => (
                    <SortableSectionCard
                      isDeleteDisabled={sections.length <= 1 || isSaving}
                      key={section.id}
                      onDelete={() => void requestSectionDelete(section)}
                      onUpdate={updateSection}
                      section={section}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TooltipProvider>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={softNoteClass}>{status}</p>
          <Button className={primaryButtonClass} disabled={isSaving} type="submit">
            <Check size={18} />
            Save settings
          </Button>
        </div>
      </form>

      <Card className={cn(panelClass, 'grid gap-3.5 p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2>Delete project</h2>
            <p className={cn(softNoteClass, 'mt-1')}>
              Remove this project from the sidebar and switch to another project.
            </p>
          </div>
          <Button
            className={dangerButtonClass}
            disabled={isSaving}
            onClick={() => setProjectDeleteOpen(true)}
            type="button"
            variant="destructive"
          >
            <Trash2 size={17} />
            Delete project
          </Button>
        </div>
      </Card>

      <BoardSectionDeleteDialog
        affectedItems={pendingDelete?.affectedItems ?? 0}
        isDeleting={isSaving}
        isOpen={pendingDelete !== null}
        onCancel={() => {
          if (!isSaving) setPendingDelete(null)
        }}
        onConfirm={() => void confirmSectionDelete()}
        sectionName={pendingDelete?.section.name ?? ''}
      />

      <ProjectDeleteDialog
        isDeleting={isSaving}
        isOpen={isProjectDeleteOpen}
        onCancel={() => {
          if (!isSaving) setProjectDeleteOpen(false)
        }}
        onConfirm={() => void confirmProjectDelete()}
        projectName={project.name}
      />
    </main>
  )
}

function ProjectDeleteDialog({
  isDeleting,
  isOpen,
  onCancel,
  onConfirm,
  projectName,
}: {
  isDeleting: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  projectName: string
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="max-w-[440px] rounded-lg bg-[var(--surface)] p-[26px] shadow-[0_30px_80px_rgba(37,37,37,0.2)] sm:max-w-[440px]">
        <DialogHeader className="gap-3 pr-8">
          <div className="flex size-10 items-center justify-center rounded-lg border border-[rgba(184,92,56,0.2)] bg-[rgba(247,232,223,0.78)] text-[var(--real-fire)]">
            <AlertTriangle size={20} />
          </div>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription className="text-sm leading-[1.55] text-[var(--text-secondary)]">
            Delete "{projectName}"? The project will be removed from the sidebar
            and you will switch to another active project. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            className={secondaryButtonClass}
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={dangerButtonClass}
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            <Trash2 size={17} />
            {isDeleting ? 'Deleting...' : 'Delete project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BoardSectionDeleteDialog({
  affectedItems,
  isDeleting,
  isOpen,
  onCancel,
  onConfirm,
  sectionName,
}: {
  affectedItems: number
  isDeleting: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  sectionName: string
}) {
  const itemLabel = affectedItems === 1 ? 'item' : 'items'

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent className="max-w-[440px] rounded-lg bg-[var(--surface)] p-[26px] shadow-[0_30px_80px_rgba(37,37,37,0.2)] sm:max-w-[440px]">
        <DialogHeader className="gap-3 pr-8">
          <div className="flex size-10 items-center justify-center rounded-lg border border-[rgba(184,92,56,0.2)] bg-[rgba(247,232,223,0.78)] text-[var(--real-fire)]">
            <AlertTriangle size={20} />
          </div>
          <DialogTitle>Delete section</DialogTitle>
          <DialogDescription className="text-sm leading-[1.55] text-[var(--text-secondary)]">
            Delete "{sectionName}" from this board?
            {affectedItems > 0
              ? ` ${affectedItems} ${itemLabel} in this section will be archived.`
              : ' No work items are currently in this section.'}
            {' '}This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            className={secondaryButtonClass}
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={dangerButtonClass}
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
            variant="destructive"
          >
            <Trash2 size={17} />
            {isDeleting ? 'Deleting...' : 'Delete section'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortableSectionCard({
  isDeleteDisabled,
  onDelete,
  onUpdate,
  section,
}: {
  isDeleteDisabled: boolean
  onDelete: () => void
  onUpdate: (
    sectionId: string,
    key: keyof Omit<BoardSection, 'id'>,
    value: string,
  ) => void
  section: BoardSection
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id })
  const style = {
    ...(sectionColorStyle(section) as CSSProperties),
    opacity: isDragging ? 0.72 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <Card
      className={cn(
        'grid gap-3.5 rounded-lg border border-[var(--section-border)] bg-[var(--section-bg)] p-4 shadow-none',
        isDragging && 'relative shadow-[0_18px_44px_rgba(63,52,34,0.16)]',
      )}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={`Reorder ${section.name}`}
                className="mt-0.5 size-5 cursor-grab touch-none rounded-md border-0 bg-transparent p-0 text-[var(--text-secondary)] shadow-none hover:bg-transparent hover:text-[var(--section-color)] focus-visible:ring-2 focus-visible:ring-[var(--section-color)] active:cursor-grabbing"
                ref={setActivatorNodeRef}
                size="icon"
                type="button"
                variant="ghost"
                {...attributes}
                {...listeners}
              >
                <GripVertical size={17} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="rounded-[7px] bg-[#252525] px-[9px] py-[7px] text-[0.72rem] leading-[1.3] font-medium text-[#fffaf2] shadow-[0_12px_30px_rgba(37,37,37,0.18)]"
              side="top"
              sideOffset={6}
            >
              Reorder
            </TooltipContent>
          </Tooltip>
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-[var(--section-color)]" />
            <strong className="min-w-0 truncate">{section.name}</strong>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            aria-label={`Delete ${section.name}`}
            className={cn(dangerButtonClass, 'min-h-8 px-2 py-1')}
            disabled={isDeleteDisabled}
            onClick={onDelete}
            type="button"
            variant="destructive"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px]">
        <Label className={fieldLabelClass}>
          <span>Name</span>
          <Input
            className={fieldClass}
            onChange={(event) => onUpdate(section.id, 'name', event.target.value)}
            required
            value={section.name}
          />
        </Label>
        <Label className={fieldLabelClass}>
          <span>Color</span>
          <Input
            className="h-[42px] rounded-lg border border-[var(--border)] bg-white/80 p-1"
            onChange={(event) => onUpdate(section.id, 'color', event.target.value)}
            type="color"
            value={section.color}
          />
        </Label>
      </div>

      <Label className={fieldLabelClass}>
        <span>Description</span>
        <Textarea
          className={textareaClass}
          onChange={(event) =>
            onUpdate(section.id, 'description', event.target.value)
          }
          placeholder="What belongs in this section?"
          value={section.description}
        />
      </Label>
    </Card>
  )
}

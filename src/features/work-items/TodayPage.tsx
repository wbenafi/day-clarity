import { AppHeader } from '@/components/app/AppHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  dangerButtonClass,
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
  mainClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  softNoteClass,
  textareaClass,
  toneStyles,
} from '@/lib/appStyles'
import { getLocalDateKey } from '@/lib/date'
import { cn } from '@/lib/utils'
import {
  archiveWorkItem,
  createWorkItem,
  listWorkItemsByDate,
  updateWorkItem,
} from '@/lib/data'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type {
  NewWorkItem,
  Project,
  WorkCategory,
  WorkItem,
  WorkLink,
} from '../../lib/types'
import {
  categories,
  categoryMeta,
  getSignalOption,
  groupByCategory,
  impactLabels,
  impactOptions,
  normalizeWorkLinks,
  type SignalOption,
  urgencyLabels,
  urgencyOptions,
} from './workItemRules'

const subtitles = [
  'What are you carrying today?',
  'Sort the work. Clear your mind.',
  'Not everything urgent belongs to you.',
]

export function TodayPage({ project }: { project: Project }) {
  const today = getLocalDateKey()
  const [items, setItems] = useState<WorkItem[]>([])
  const [isComposerOpen, setComposerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [isLoading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setItems(await listWorkItemsByDate(project.id, today))
    setLoading(false)
  }, [project.id, today])

  useEffect(() => {
    let isMounted = true

    listWorkItemsByDate(project.id, today).then((loadedItems) => {
      if (!isMounted) return
      setItems(loadedItems)
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [project.id, today])

  const openItems = items.filter((item) => item.status === 'open')
  const doneItems = items.filter((item) => item.status === 'done')
  const groupedItems = groupByCategory(openItems)

  async function saveItem(item: NewWorkItem | WorkItem) {
    if ('id' in item) {
      await updateWorkItem(item)
    } else {
      await createWorkItem(item)
    }
    setComposerOpen(false)
    setEditingItem(null)
    await refresh()
  }

  async function toggleDone(item: WorkItem) {
    const isMarkingDone = item.status !== 'done'

    await updateWorkItem({
      ...item,
      date: isMarkingDone ? today : item.date,
      status: isMarkingDone ? 'done' : 'open',
      completedAt: isMarkingDone ? Date.now() : undefined,
    })
    await refresh()
  }

  async function deleteItem(item: WorkItem) {
    await archiveWorkItem(item.id)
    setComposerOpen(false)
    setEditingItem(null)
    await refresh()
  }

  return (
    <main className={mainClass}>
      <AppHeader subtitle={subtitles[new Date().getDay() % subtitles.length]} />

      <Card className="relative grid items-end gap-7 overflow-hidden rounded-lg border-[rgba(226,221,212,0.8)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,237,231,0.74)),var(--surface)] p-[clamp(24px,5vw,48px)] shadow-[var(--shadow-soft)] md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className={eyebrowClass}>Today</p>
          <h1 className="max-w-[15ch] text-[clamp(1.95rem,3vw,3.25rem)] leading-[1.02]">
            Clear the day before it carries you.
          </h1>
          <p className="mt-[18px] max-w-[58ch] text-[1.05rem] text-[var(--text-secondary)]">
            Capture work once, decide what it is, and make a calmer call about
            what actually belongs in today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 max-md:w-full">
          <Button
            className={cn(primaryButtonClass, 'max-md:flex-1')}
            onClick={() => setComposerOpen(true)}
            type="button"
          >
            <Plus size={18} />
            Add item
          </Button>
          <Button
            asChild
            className={cn(secondaryButtonClass, 'max-md:flex-1')}
            variant="outline"
          >
            <Link to="/close">
              <Sparkles size={18} />
              Start Daily Close
            </Link>
          </Button>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-2 bg-[linear-gradient(90deg,rgba(63,77,60,0.2),rgba(181,139,42,0.12))]"
        />
      </Card>

      {isLoading ? (
        <p className={softNoteClass}>Loading today’s work...</p>
      ) : (
        <section className="grid items-start gap-3.5 md:grid-cols-2">
          {categories.map((category) => (
            <CategoryColumn
              key={category}
              category={category}
              items={groupedItems[category]}
              onEdit={setEditingItem}
              onToggleDone={toggleDone}
            />
          ))}
        </section>
      )}

      <Card className="rounded-lg border-[var(--border)] bg-white/60 p-2.5 shadow-none">
        <Button
          className="h-auto w-full justify-between rounded-lg bg-transparent p-2.5 text-[var(--text-primary)] hover:bg-white/70"
          onClick={() => setCompletedOpen((isOpen) => !isOpen)}
          type="button"
          variant="ghost"
        >
          <span className="inline-flex items-center gap-2 font-[760]">
            <Check size={18} />
            Completed today
          </span>
          <span className="inline-flex items-center gap-2">
            {doneItems.length} item{doneItems.length === 1 ? '' : 's'}
            <ChevronDown
              className={cn('transition-transform', completedOpen && 'rotate-180')}
              size={18}
            />
          </span>
        </Button>
        {completedOpen && (
          <CardContent className="grid gap-3 p-0 pt-2">
            {doneItems.length === 0 ? (
              <p className={softNoteClass}>
                Finished, moved forward, unblocked, or clarified work will land here.
              </p>
            ) : (
              doneItems.map((item) => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  onToggleDone={toggleDone}
                />
              ))
            )}
          </CardContent>
        )}
      </Card>

      {(isComposerOpen || editingItem) && (
        <ItemComposer
          isOpen
          item={editingItem}
          key={editingItem?.id ?? 'new-item'}
          onClose={() => {
            setComposerOpen(false)
            setEditingItem(null)
          }}
          onDelete={deleteItem}
          onSave={saveItem}
          projectId={project.id}
          today={today}
          workItems={items}
        />
      )}
    </main>
  )
}

function CategoryColumn({
  category,
  items,
  onEdit,
  onToggleDone,
}: {
  category: WorkCategory
  items: WorkItem[]
  onEdit: (item: WorkItem) => void
  onToggleDone: (item: WorkItem) => Promise<void>
}) {
  const meta = categoryMeta[category]
  const tone = toneStyles[meta.tone]

  return (
    <Card className={cn('min-w-0 rounded-lg p-3.5 shadow-none', tone.bg, tone.border)}>
      <div className="mb-3.5 flex items-start gap-2.5">
        <span
          className={cn(
            'mt-1 size-[11px] shrink-0 rounded-full shadow-[inset_0_0_0_999px_currentColor]',
            tone.text,
          )}
        />
        <div>
          <h2>{meta.plural}</h2>
          <p className="mt-1 text-[0.84rem] leading-[1.35] text-[var(--text-secondary)]">
            {meta.description}
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card className={cn(panelClass, 'p-[18px] text-sm text-[var(--text-secondary)]')}>
            <p>Nothing here right now.</p>
          </Card>
        ) : (
          items.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onToggleDone={onToggleDone}
            />
          ))
        )}
      </div>
    </Card>
  )
}

function WorkItemCard({
  item,
  onEdit,
  onToggleDone,
}: {
  item: WorkItem
  onEdit: (item: WorkItem) => void
  onToggleDone: (item: WorkItem) => Promise<void>
}) {
  const urgencyOption = getSignalOption(urgencyOptions, item.urgency)
  const impactOption = getSignalOption(impactOptions, item.impact)

  function openEdit() {
    onEdit(item)
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openEdit()
  }

  return (
    <Card
      aria-label={`Edit ${item.title}`}
      className={cn(
        panelClass,
        'cursor-pointer p-3.5 shadow-[var(--shadow-card)] transition hover:-translate-y-px hover:border-[rgba(63,77,60,0.22)] hover:shadow-[0_15px_34px_rgba(63,52,34,0.1)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(63,77,60,0.25)]',
        item.status === 'done' && 'opacity-70',
      )}
      onClick={openEdit}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="grid items-start gap-2.5 [grid-template-columns:minmax(0,1fr)_auto]">
        <div>
          <h3
            className={cn(
              item.status === 'done' &&
                'line-through decoration-[rgba(107,102,95,0.5)]',
            )}
          >
            {item.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-[7px] text-xs text-[var(--text-secondary)]">
            {item.urgency && urgencyOption && (
              <SignalBadge
                label={urgencyLabels[item.urgency]}
                option={urgencyOption}
              />
            )}
            {item.impact && impactOption && (
              <SignalBadge
                label={impactLabels[item.impact]}
                option={impactOption}
              />
            )}
          </div>
        </div>
        <Button
          aria-label={item.status === 'done' ? 'Reopen item' : 'Mark item done'}
          className="mt-px size-[25px] rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-0 text-[var(--app-accent)] hover:bg-[var(--surface-muted)]"
          onClick={(event) => {
            event.stopPropagation()
            void onToggleDone(item)
          }}
          size="icon-xs"
          type="button"
          variant="outline"
        >
          {item.status === 'done' && <Check size={15} />}
        </Button>
      </div>

      {item.requestedBy && (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Asked by:</strong>{' '}
          {item.requestedBy}
        </p>
      )}
      {item.displaces && (
        <div
          className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[rgba(226,221,212,0.8)] bg-[rgba(240,237,231,0.6)] py-1 pr-2 pl-1.5"
          aria-label={`Displaces ${item.displaces}`}
        >
          <span className="inline-flex shrink-0 items-center gap-1 text-[0.72rem] font-extrabold uppercase tracking-[0.02em] text-[var(--app-accent)]">
            <ArrowRight size={13} />
            Displaces
          </span>
          <span className="block min-w-0 truncate text-[0.78rem] font-semibold text-[var(--text-secondary)]">
            {item.displaces}
          </span>
        </div>
      )}
      {item.links && item.links.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-[7px]" aria-label="Work item links">
          {item.links.map((link) => (
            <LinkPill key={`${link.label}-${link.url}`} link={link} />
          ))}
        </div>
      )}
    </Card>
  )
}

function LinkPill({ link }: { link: WorkLink }) {
  function openLink(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    event.stopPropagation()
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Badge
      asChild
      className="min-h-[26px] max-w-full rounded-full border-0 bg-[rgba(63,77,60,0.08)] px-[9px] py-1.5 text-[0.78rem] font-[760] text-[var(--app-accent)] hover:bg-[rgba(63,77,60,0.13)]"
      variant="secondary"
    >
      <a
        href={link.url}
        onClick={openLink}
        onKeyDown={(event) => event.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
        title={link.url}
      >
        <ExternalLink size={13} strokeWidth={2.35} />
        {link.label}
      </a>
    </Badge>
  )
}

function SignalBadge<Value extends string>({
  label,
  option,
}: {
  label: string
  option: SignalOption<Value>
}) {
  const { Icon, detail, tone } = option
  const toneClass = toneStyles[tone]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn(
            'rounded-full border-0 px-2 py-1 text-[0.78rem] font-semibold leading-none',
            toneClass.bg,
            toneClass.text,
          )}
          variant="secondary"
        >
          <Icon size={13} strokeWidth={2.4} />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{detail}</TooltipContent>
    </Tooltip>
  )
}

function ItemComposer({
  isOpen,
  item,
  onClose,
  onDelete,
  onSave,
  projectId,
  today,
  workItems,
}: {
  isOpen: boolean
  item: WorkItem | null
  onClose: () => void
  onDelete: (item: WorkItem) => Promise<void>
  onSave: (item: NewWorkItem | WorkItem) => Promise<void>
  projectId: string
  today: string
  workItems: WorkItem[]
}) {
  const [draft, setDraft] = useState<NewWorkItem | WorkItem>(
    item ?? {
      title: '',
      category: 'real_commitment',
      urgency: 'today',
      impact: 'medium',
      requestedBy: '',
      displaces: '',
      links: [],
      notes: '',
      projectId,
      status: 'open',
      date: today,
    },
  )

  const isEditing = 'id' in draft
  const title = isEditing ? 'Edit work item' : 'Add work item'
  const displacementOptions = workItems.filter(
    (workItem) =>
      workItem.status === 'open' && (!('id' in draft) || workItem.id !== draft.id),
  )
  const selectedDisplacementStillExists = displacementOptions.some(
    (workItem) => workItem.title === draft.displaces,
  )

  function updateDraft<Key extends keyof (NewWorkItem | WorkItem)>(
    key: Key,
    value: (NewWorkItem | WorkItem)[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return
    const links = normalizeWorkLinks(draft.links)
    await onSave({
      ...draft,
      title: draft.title.trim(),
      requestedBy: draft.requestedBy?.trim(),
      displaces: draft.displaces?.trim(),
      links: links.length > 0 ? links : undefined,
      notes: draft.notes?.trim(),
    })
  }

  async function deleteDraft() {
    if (!('id' in draft)) return
    await onDelete(draft)
  }

  function addLink() {
    updateDraft('links', [...(draft.links ?? []), { label: '', url: '' }])
  }

  function updateLink(index: number, key: keyof WorkLink, value: string) {
    updateDraft(
      'links',
      (draft.links ?? []).map((link, linkIndex) =>
        linkIndex === index ? { ...link, [key]: value } : link,
      ),
    )
  }

  function removeLink(index: number) {
    updateDraft(
      'links',
      (draft.links ?? []).filter((_, linkIndex) => linkIndex !== index),
    )
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[min(850px,calc(100svh-40px))] max-w-[920px] overflow-y-auto rounded-lg bg-[var(--surface)] p-[26px] shadow-[0_30px_80px_rgba(37,37,37,0.2)] sm:max-w-[920px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Capture the work item details, category, urgency, impact, and links.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={(event) => void submitForm(event)}>
          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="grid gap-5">
              <Label className={cn(fieldLabelClass, 'mb-0.5')}>
                <span>Title</span>
                <Input
                  autoFocus
                  className={cn(
                    fieldClass,
                    'min-h-[60px] py-[15px] text-[1.55rem] font-[700] leading-tight placeholder:text-[rgba(107,102,95,0.68)] placeholder:font-medium md:text-[1.55rem]',
                  )}
                  onChange={(event) => updateDraft('title', event.target.value)}
                  placeholder="What work are you carrying?"
                  required
                  value={draft.title}
                />
              </Label>

              <fieldset className="min-w-0 border-0 p-0">
                <legend className="mb-2.5 text-sm font-[750] text-[var(--text-primary)]">
                  Category
                </legend>
                <RadioGroup
                  className="grid gap-3 sm:grid-cols-2"
                  onValueChange={(value) =>
                    updateDraft('category', value as WorkCategory)
                  }
                  value={draft.category}
                >
                  {categories.map((category) => {
                    const meta = categoryMeta[category]
                    const tone = toneStyles[meta.tone]
                    const isSelected = draft.category === category
                    const id = `category-${category}`

                    return (
                      <div className="group relative" key={category}>
                        <RadioGroupItem
                          aria-label={meta.label}
                          className="absolute inset-0 z-10 !size-full !aspect-auto cursor-pointer rounded-lg border-0 opacity-0 after:hidden focus-visible:ring-0"
                          id={id}
                          value={category}
                        />
                        <div
                          className={cn(
                            'pointer-events-none relative grid min-h-full items-start gap-2.5 rounded-lg border p-3 text-left transition group-hover:-translate-y-px peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgba(63,77,60,0.25)]',
                            '[grid-template-columns:auto_minmax(0,1fr)]',
                            tone.bg,
                            tone.border,
                            tone.text,
                            isSelected &&
                              'shadow-[inset_0_0_0_1px_currentColor,0_10px_24px_rgba(63,52,34,0.08)]',
                          )}
                        >
                          <span className="mt-1 size-[13px] rounded-full bg-current shadow-[0_0_0_4px_rgba(255,255,255,0.72)]" />
                          <span>
                            <strong className="block leading-tight text-[var(--text-primary)]">
                              {meta.label}
                            </strong>
                            <small className="mt-1 block text-[0.78rem] font-medium leading-[1.3] text-[var(--text-secondary)]">
                              {meta.description}
                            </small>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </RadioGroup>
              </fieldset>

              <Label className={fieldLabelClass}>
                <span>Who asked for this?</span>
                <Input
                  className={fieldClass}
                  onChange={(event) =>
                    updateDraft('requestedBy', event.target.value)
                  }
                  placeholder="Name, team, or source"
                  value={draft.requestedBy ?? ''}
                />
              </Label>

              <Label
                className={cn(
                  fieldLabelClass,
                  'border-l-[3px] border-[rgba(63,77,60,0.4)] py-1 pl-3.5',
                )}
              >
                <span>What does this displace?</span>
                <NativeSelect
                  className="w-full"
                  disabled={displacementOptions.length === 0}
                  onChange={(event) => updateDraft('displaces', event.target.value)}
                  selectClassName={cn(fieldClass, 'pr-8 text-[var(--text-secondary)]')}
                  value={draft.displaces ?? ''}
                >
                  <NativeSelectOption value="">
                    {displacementOptions.length === 0
                      ? 'No other open work items yet'
                      : 'If this enters today, what moves out?'}
                  </NativeSelectOption>
                  {draft.displaces && !selectedDisplacementStillExists && (
                    <NativeSelectOption value={draft.displaces}>
                      {draft.displaces}
                    </NativeSelectOption>
                  )}
                  {displacementOptions.map((workItem) => (
                    <NativeSelectOption key={workItem.id} value={workItem.title}>
                      {workItem.title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <small className="text-[0.78rem] font-medium leading-[1.35] text-[var(--text-secondary)]">
                  Choose the current work item that would make room for this one.
                </small>
              </Label>

              <fieldset className="grid min-w-0 gap-2.5 border-0 p-0">
                <legend className="text-sm font-[750] text-[var(--text-primary)]">
                  Links
                </legend>
                <div className="flex items-center justify-between gap-2.5 max-sm:flex-col max-sm:items-stretch">
                  <small className="max-w-[42ch] text-[0.78rem] font-medium leading-[1.35] text-[var(--text-secondary)]">
                    Paste a URL and the label can be filled in automatically.
                  </small>
                  <Button
                    className="h-auto min-h-[30px] rounded-full bg-[rgba(63,77,60,0.08)] px-2.5 py-1.5 text-[0.78rem] font-extrabold text-[var(--app-accent)] hover:bg-[rgba(63,77,60,0.13)]"
                    onClick={addLink}
                    type="button"
                    variant="ghost"
                  >
                    <Plus size={15} />
                    Add link
                  </Button>
                </div>
                {(draft.links ?? []).length === 0 ? (
                  <p className={softNoteClass}>No links added yet.</p>
                ) : (
                  <div className="grid gap-2.5">
                    {(draft.links ?? []).map((link, index) => (
                      <div
                        className="grid items-end gap-2.5 rounded-lg border border-[rgba(226,221,212,0.68)] bg-white/20 p-2.5 sm:grid-cols-[minmax(110px,0.45fr)_minmax(160px,1fr)_auto]"
                        key={index}
                      >
                        <Label className={cn(fieldLabelClass, 'gap-1')}>
                          <span className="text-[0.72rem] text-[var(--text-secondary)]">
                            Label
                          </span>
                          <Input
                            className={fieldClass}
                            onChange={(event) =>
                              updateLink(index, 'label', event.target.value)
                            }
                            placeholder="Design spec"
                            value={link.label}
                          />
                        </Label>
                        <Label className={cn(fieldLabelClass, 'gap-1')}>
                          <span className="text-[0.72rem] text-[var(--text-secondary)]">
                            Link
                          </span>
                          <Input
                            className={fieldClass}
                            onChange={(event) =>
                              updateLink(index, 'url', event.target.value)
                            }
                            placeholder="https://example.com"
                            value={link.url}
                          />
                        </Label>
                        <Button
                          aria-label={`Remove link ${index + 1}`}
                          className="size-[34px] justify-self-end rounded-lg border border-[rgba(226,221,212,0.9)] text-[var(--text-secondary)] hover:border-[rgba(184,92,56,0.2)] hover:bg-[var(--real-fire-bg)] hover:text-[var(--real-fire)]"
                          onClick={() => removeLink(index)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <X size={15} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>

              <Label className={fieldLabelClass}>
                <span>Notes</span>
                <Textarea
                  className={textareaClass}
                  onChange={(event) => updateDraft('notes', event.target.value)}
                  placeholder="Context, constraints, or what clarity would look like."
                  value={draft.notes ?? ''}
                />
              </Label>
            </div>

            <aside
              className="sticky top-0 grid gap-[18px] rounded-lg border border-[rgba(63,77,60,0.2)] p-4 max-md:static"
              aria-label="Item priority"
            >
              <SignalOptionGroup
                label="Urgency"
                onSelect={(urgency) => updateDraft('urgency', urgency)}
                options={urgencyOptions}
                selected={draft.urgency ?? 'unclear'}
              />

              <SignalOptionGroup
                label="Impact"
                onSelect={(impact) => updateDraft('impact', impact)}
                options={impactOptions}
                selected={draft.impact ?? 'medium'}
              />
            </aside>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2.5 max-sm:flex-col-reverse max-sm:items-stretch">
            {isEditing ? (
              <Button
                className={dangerButtonClass}
                onClick={() => void deleteDraft()}
                type="button"
                variant="destructive"
              >
                <Trash2 size={17} />
                Delete item
              </Button>
            ) : (
              <span />
            )}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5 max-sm:ml-0 max-sm:flex-col-reverse max-sm:items-stretch">
              <Button
                className={secondaryButtonClass}
                onClick={onClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className={primaryButtonClass} type="submit">
                <Check size={18} />
                Save item
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SignalOptionGroup<Value extends string>({
  label,
  onSelect,
  options,
  selected,
}: {
  label: string
  onSelect: (value: Value) => void
  options: Array<SignalOption<Value>>
  selected: Value
}) {
  return (
    <fieldset className="grid min-w-0 gap-[9px] border-0 p-0">
      <legend className="mb-0.5 text-[0.82rem] font-extrabold text-[var(--text-primary)]">
        {label}
      </legend>
      <RadioGroup
        className="grid gap-[7px]"
        onValueChange={(value) => onSelect(value as Value)}
        value={selected}
      >
        {options.map(({ Icon, detail, label: optionLabel, tone, value }) => {
          const isSelected = selected === value
          const toneClass = toneStyles[tone]
          const id = `${label.toLowerCase()}-${value}`

          return (
            <div className="group relative" key={value}>
              <RadioGroupItem
                aria-describedby={`${id}-tooltip`}
                aria-label={optionLabel}
                className="peer absolute inset-0 z-10 !size-full !aspect-auto cursor-pointer rounded-[7px] border-0 opacity-0 after:hidden focus-visible:ring-0"
                id={id}
                value={value}
              />
              <div
                className={cn(
                  'pointer-events-none grid min-h-[43px] items-center gap-[9px] rounded-[7px] border-0 border-l-[3px] border-l-transparent p-[7px_7px_7px_9px] text-left transition [grid-template-columns:auto_minmax(0,1fr)] group-hover:bg-white/30 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgba(63,77,60,0.25)]',
                  isSelected &&
                    cn(
                      toneClass.bg,
                      'border-l-current shadow-[inset_0_0_0_1px_rgba(37,37,37,0.04)]',
                    ),
                  isSelected && toneClass.text,
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-[29px] items-center justify-center rounded-[7px] border',
                    toneClass.bg,
                    toneClass.border,
                    toneClass.text,
                    isSelected &&
                      cn(toneClass.selectedBg, 'border-transparent text-white'),
                  )}
                >
                  <Icon size={15} strokeWidth={2.3} />
                </span>
                <strong className="block min-w-0 text-[0.84rem] leading-tight text-[var(--text-primary)]">
                  {optionLabel}
                </strong>
              </div>
              <span
                className="pointer-events-none absolute top-[calc(100%+6px)] left-[38px] z-[60] block max-w-[180px] translate-y-[-2px] rounded-[7px] bg-[#252525] px-[9px] py-[7px] text-[0.72rem] leading-[1.3] font-medium text-[#fffaf2] opacity-0 shadow-[0_12px_30px_rgba(37,37,37,0.18)] transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 before:absolute before:top-[-11px] before:left-3 before:border-6 before:border-transparent before:border-b-[#252525]"
                id={`${id}-tooltip`}
                role="tooltip"
              >
                {detail}
              </span>
            </div>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCopy,
  Clock,
  ExternalLink,
  Gauge,
  HelpCircle,
  History,
  ListChecks,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import {
  archiveWorkItem,
  createDailyClose,
  createWorkItem,
  listDailyCloses,
  listWorkItemsByDate,
  updateWorkItem,
} from './lib/data'
import type {
  DailyClose,
  Impact,
  NewWorkItem,
  Urgency,
  WorkCategory,
  WorkItem,
  WorkLink,
} from './lib/types'

const categoryMeta: Record<
  WorkCategory,
  {
    label: string
    plural: string
    description: string
    tone: string
  }
> = {
  real_commitment: {
    label: 'My Real Commitment',
    plural: 'My Real Commitments',
    description: 'Work you accepted, own, and should actually move forward.',
    tone: 'commitment',
  },
  real_fire: {
    label: 'Real Fire',
    plural: 'Real Fires',
    description: 'Urgent work with real impact if ignored.',
    tone: 'real-fire',
  },
  borrowed_fire: {
    label: 'Borrowed Fire',
    plural: 'Borrowed Fires',
    description: 'Someone else’s urgency that may not belong to you.',
    tone: 'borrowed-fire',
  },
  noise: {
    label: 'Noise / Needs Clarity',
    plural: 'Noise / Needs Clarity',
    description: 'Vague, duplicated, unclear, or unprioritized work.',
    tone: 'noise',
  },
}

const categories = Object.keys(categoryMeta) as WorkCategory[]

const urgencyLabels: Record<Urgency, string> = {
  today: 'Today',
  this_week: 'This week',
  unclear: 'Unclear',
  later: 'Later',
}

const impactLabels: Record<Impact, string> = {
  low: 'Low impact',
  medium: 'Medium impact',
  high: 'High impact',
}

const urgencyOptions: Array<SignalOption<Urgency>> = [
  {
    Icon: Clock,
    detail: 'Needs attention before the day ends.',
    label: 'Today',
    tone: 'urgency-today',
    value: 'today',
  },
  {
    Icon: CalendarDays,
    detail: 'Relevant soon, but not a fire.',
    label: 'This week',
    tone: 'urgency-week',
    value: 'this_week',
  },
  {
    Icon: HelpCircle,
    detail: 'Needs a decision before effort.',
    label: 'Unclear',
    tone: 'urgency-unclear',
    value: 'unclear',
  },
  {
    Icon: ArrowRight,
    detail: 'Can wait without being carried.',
    label: 'Later',
    tone: 'urgency-later',
    value: 'later',
  },
]

const impactOptions: Array<SignalOption<Impact>> = [
  {
    Icon: Minus,
    detail: 'Small consequence if delayed.',
    label: 'Low',
    tone: 'impact-low',
    value: 'low',
  },
  {
    Icon: Gauge,
    detail: 'Meaningful, but bounded.',
    label: 'Medium',
    tone: 'impact-medium',
    value: 'medium',
  },
  {
    Icon: TrendingUp,
    detail: 'High consequence or leverage.',
    label: 'High',
    tone: 'impact-high',
    value: 'high',
  },
]

const urgencySortRank: Record<Urgency, number> = {
  today: 0,
  this_week: 1,
  unclear: 2,
  later: 3,
}

const impactSortRank: Record<Impact, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const subtitles = [
  'What are you carrying today?',
  'Sort the work. Clear your mind.',
  'Not everything urgent belongs to you.',
]

type SignalOption<Value extends string> = {
  Icon: LucideIcon
  detail: string
  label: string
  tone: string
  value: Value
}

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/close" element={<DailyClosePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  )
}

function TodayPage() {
  const today = getLocalDateKey()
  const [items, setItems] = useState<WorkItem[]>([])
  const [isComposerOpen, setComposerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [isLoading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setItems(await listWorkItemsByDate(today))
    setLoading(false)
  }, [today])

  useEffect(() => {
    let isMounted = true

    listWorkItemsByDate(today).then((loadedItems) => {
      if (!isMounted) return
      setItems(loadedItems)
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [today])

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
    await updateWorkItem({
      ...item,
      status: item.status === 'done' ? 'open' : 'done',
      completedAt: item.status === 'done' ? undefined : Date.now(),
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
    <main>
      <AppHeader subtitle={subtitles[new Date().getDay() % subtitles.length]} />

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Today</p>
          <h1>Clear the day before it carries you.</h1>
          <p>
            Capture work once, decide what it is, and make a calmer call about
            what actually belongs in today.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-action" onClick={() => setComposerOpen(true)} type="button">
            <Plus size={18} />
            Add item
          </button>
          <Link className="secondary-action" to="/close">
            <Sparkles size={18} />
            Start Daily Close
          </Link>
        </div>
      </section>

      {isLoading ? (
        <p className="soft-note">Loading today’s work...</p>
      ) : (
        <section className="category-grid">
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

      <section className="completed-panel">
        <button
          className="completed-toggle"
          onClick={() => setCompletedOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span>
            <Check size={18} />
            Completed today
          </span>
          <span>
            {doneItems.length} item{doneItems.length === 1 ? '' : 's'}
            <ChevronDown
              className={completedOpen ? 'chevron-open' : ''}
              size={18}
            />
          </span>
        </button>
        {completedOpen && (
          <div className="completed-list">
            {doneItems.length === 0 ? (
              <p className="soft-note">
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
          </div>
        )}
      </section>

      {(isComposerOpen || editingItem) && (
        <ItemComposer
          item={editingItem}
          onClose={() => {
            setComposerOpen(false)
            setEditingItem(null)
          }}
          onDelete={deleteItem}
          onSave={saveItem}
          today={today}
          workItems={items}
        />
      )}
    </main>
  )
}

function DailyClosePage() {
  const navigate = useNavigate()
  const today = getLocalDateKey()
  const [items, setItems] = useState<WorkItem[]>([])
  const [extraFinished, setExtraFinished] = useState('')
  const [stillOpen, setStillOpen] = useState<string[]>([])
  const [needsDecision, setNeedsDecision] = useState<string[]>([])
  const [firstStepTomorrow, setFirstStepTomorrow] = useState('')
  const [summary, setSummary] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy Markdown')

  useEffect(() => {
    async function loadItems() {
      const loadedItems = await listWorkItemsByDate(today)
      setItems(loadedItems)
      setStillOpen(
        loadedItems
          .filter((item) => item.status === 'open')
          .map((item) => item.title),
      )
      setNeedsDecision(
        loadedItems
          .filter((item) => item.status === 'open' && needsPrioritization(item))
          .map((item) => item.title),
      )
    }

    void loadItems()
  }, [today])

  const finishedTitles = useMemo(() => {
    const done = items.filter((item) => item.status === 'done').map((item) => item.title)
    return [...done, ...splitLines(extraFinished)]
  }, [extraFinished, items])

  async function completeClose() {
    const markdownSummary = buildMarkdownSummary({
      date: formatLongDate(today),
      finished: finishedTitles,
      stillOpen,
      needsPrioritization: needsDecision,
      firstStepTomorrow,
    })

    await createDailyClose({
      date: today,
      finished: finishedTitles,
      stillOpen,
      needsPrioritization: needsDecision,
      firstStepTomorrow,
      markdownSummary,
    })
    setSummary(markdownSummary)
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary)
    setCopyLabel('Copied')
    window.setTimeout(() => setCopyLabel('Copy Markdown'), 1600)
  }

  return (
    <main>
      <AppHeader subtitle="You can leave work unfinished without carrying it all night." />
      <div className="page-top">
        <button className="quiet-button" onClick={() => navigate('/')} type="button">
          <ArrowLeft size={17} />
          Back to today
        </button>
        <h1>Close the day with clarity.</h1>
        <p>
          This is a short reset: name what moved, release what remains, and pick
          one first step for tomorrow.
        </p>
      </div>

      <section className="close-grid">
        <CloseSection
          kicker="1"
          prompt="What did you finish, move forward, unblock, or clarify today?"
          title="Finished today"
        >
          <SuggestionList titles={finishedTitles} empty="No completed items yet." />
          <label className="field-label" htmlFor="extra-finished">
            Add invisible work
          </label>
          <textarea
            id="extra-finished"
            onChange={(event) => setExtraFinished(event.target.value)}
            placeholder="One per line: clarified launch scope, unblocked Sarah, reviewed draft"
            value={extraFinished}
          />
        </CloseSection>

        <CloseSection
          kicker="2"
          prompt="What is still open, but does not need to stay in your head tonight?"
          title="Still open"
        >
          <SelectableList
            selected={stillOpen}
            titles={items.filter((item) => item.status === 'open').map((item) => item.title)}
            onChange={setStillOpen}
          />
        </CloseSection>

        <CloseSection
          kicker="3"
          prompt="What needs a decision, not more effort?"
          title="Needs prioritization"
        >
          <SelectableList
            selected={needsDecision}
            titles={items
              .filter((item) => item.status === 'open' && needsPrioritization(item))
              .map((item) => item.title)}
            onChange={setNeedsDecision}
          />
        </CloseSection>

        <CloseSection
          kicker="4"
          prompt="What is the first clear step for tomorrow?"
          title="First step tomorrow"
        >
          <input
            onChange={(event) => setFirstStepTomorrow(event.target.value)}
            placeholder="Example: Ask Marta whether the report replaces sprint planning."
            value={firstStepTomorrow}
          />
        </CloseSection>
      </section>

      <div className="close-actions">
        <button className="primary-action" onClick={completeClose} type="button">
          <ListChecks size={18} />
          Generate Daily Close
        </button>
      </div>

      {summary && (
        <section className="summary-panel">
          <div>
            <p className="eyebrow">Markdown summary</p>
            <h2>Ready to carry forward.</h2>
          </div>
          <button className="secondary-action" onClick={copySummary} type="button">
            <ClipboardCopy size={18} />
            {copyLabel}
          </button>
          <pre>{summary}</pre>
        </section>
      )}
    </main>
  )
}

function HistoryPage() {
  const [closes, setCloses] = useState<DailyClose[]>([])

  useEffect(() => {
    async function loadCloses() {
      setCloses(await listDailyCloses())
    }

    void loadCloses()
  }, [])

  return (
    <main>
      <AppHeader subtitle="A record of days you chose to put down." />
      <div className="page-top">
        <Link className="quiet-button" to="/">
          <ArrowLeft size={17} />
          Back to today
        </Link>
        <h1>Daily Close history</h1>
        <p>Previous summaries stay here for reflection, not judgment.</p>
      </div>

      <section className="history-list">
        {closes.length === 0 ? (
          <div className="empty-state">
            <History size={26} />
            <h2>No daily closes yet.</h2>
            <p>Run your first Daily Close when the workday is ready to end.</p>
          </div>
        ) : (
          closes.map((close) => (
            <article className="history-card" key={close.id}>
              <p className="eyebrow">{formatLongDate(close.date)}</p>
              <pre>{close.markdownSummary}</pre>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

function AppHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        <span className="brand-mark">
          <img alt="" src="app-icon.png" />
        </span>
        <span>
          <strong>DayClarity</strong>
          <small>{formatLongDate(getLocalDateKey())}</small>
        </span>
      </Link>
      <p>{subtitle}</p>
      <nav aria-label="Primary navigation">
        <NavLink to="/">Today</NavLink>
        <NavLink to="/close">Daily Close</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>
    </header>
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

  return (
    <section className={`category-column ${meta.tone}`}>
      <div className="category-heading">
        <span className="category-dot" />
        <div>
          <h2>{meta.plural}</h2>
          <p>{meta.description}</p>
        </div>
      </div>
      <div className="card-stack">
        {items.length === 0 ? (
          <div className="empty-card">
            <p>Nothing here right now.</p>
          </div>
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
    </section>
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

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openEdit()
  }

  return (
    <article
      aria-label={`Edit ${item.title}`}
      className={`work-card ${item.status === 'done' ? 'is-done' : ''}`}
      onClick={openEdit}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="work-card-top">
        <div>
          <h3>{item.title}</h3>
          <div className="meta-row">
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
        <button
          aria-label={item.status === 'done' ? 'Reopen item' : 'Mark item done'}
          className="done-check"
          onClick={(event) => {
            event.stopPropagation()
            void onToggleDone(item)
          }}
          type="button"
        >
          {item.status === 'done' && <Check size={15} />}
        </button>
      </div>

      {item.requestedBy && (
        <p className="card-detail">
          <strong>Asked by:</strong> {item.requestedBy}
        </p>
      )}
      {item.displaces && (
        <div className="displaces-note" aria-label={`Displaces ${item.displaces}`}>
          <span className="displaces-label">
            <ArrowRight size={13} />
            Displaces
          </span>
          <span className="displaces-chip">{item.displaces}</span>
        </div>
      )}
      {item.links && item.links.length > 0 && (
        <div className="link-pill-list" aria-label="Work item links">
          {item.links.map((link) => (
            <LinkPill key={`${link.label}-${link.url}`} link={link} />
          ))}
        </div>
      )}
    </article>
  )
}

function LinkPill({ link }: { link: WorkLink }) {
  function openLink(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    event.stopPropagation()
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <a
      className="link-pill"
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

  return (
    <span className={`signal-badge ${tone}`} title={detail}>
      <Icon size={13} strokeWidth={2.4} />
      {label}
    </span>
  )
}

function ItemComposer({
  item,
  onClose,
  onDelete,
  onSave,
  today,
  workItems,
}: {
  item: WorkItem | null
  onClose: () => void
  onDelete: (item: WorkItem) => Promise<void>
  onSave: (item: NewWorkItem | WorkItem) => Promise<void>
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
      status: 'open',
      date: today,
    },
  )

  const isEditing = 'id' in draft
  const title = isEditing ? 'Edit work item' : 'Add work item'
  const displacementOptions = workItems.filter(
    (workItem) =>
      workItem.status === 'open' &&
      (!('id' in draft) || workItem.id !== draft.id),
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

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
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
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="composer-title" className="modal-card" role="dialog">
        <div className="modal-top">
          <div>
            <h2 id="composer-title">{title}</h2>
          </div>
          <button aria-label="Close composer" onClick={onClose} type="button">
            <X size={19} />
          </button>
        </div>

        <form className="composer-form" onSubmit={(event) => void submitForm(event)}>
          <div className="composer-layout">
            <div className="composer-main">
              <label className="title-field">
                <span>Title</span>
                <input
                  autoFocus
                  onChange={(event) => updateDraft('title', event.target.value)}
                  placeholder="What work are you carrying?"
                  required
                  value={draft.title}
                />
              </label>

              <fieldset className="category-selector">
                <legend>Category</legend>
                <div className="category-options">
                  {categories.map((category) => {
                    const meta = categoryMeta[category]
                    const isSelected = draft.category === category

                    return (
                      <button
                        aria-checked={isSelected}
                        className={`category-option ${meta.tone} ${
                          isSelected ? 'is-selected' : ''
                        }`}
                        key={category}
                        onClick={() => updateDraft('category', category)}
                        role="radio"
                        type="button"
                      >
                        <span className="category-swatch" />
                        <span>
                          <strong>{meta.label}</strong>
                          <small>{meta.description}</small>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label>
                <span>Who asked for this?</span>
                <input
                  onChange={(event) => updateDraft('requestedBy', event.target.value)}
                  placeholder="Name, team, or source"
                  value={draft.requestedBy ?? ''}
                />
              </label>

              <label className="displaces-field">
                <span>What does this displace?</span>
                <select
                  disabled={displacementOptions.length === 0}
                  onChange={(event) => updateDraft('displaces', event.target.value)}
                  value={draft.displaces ?? ''}
                >
                  <option value="">
                    {displacementOptions.length === 0
                      ? 'No other open work items yet'
                      : 'If this enters today, what moves out?'}
                  </option>
                  {draft.displaces && !selectedDisplacementStillExists && (
                    <option value={draft.displaces}>{draft.displaces}</option>
                  )}
                  {displacementOptions.map((workItem) => (
                    <option key={workItem.id} value={workItem.title}>
                      {workItem.title}
                    </option>
                  ))}
                </select>
                <small>
                  Choose the current work item that would make room for this one.
                </small>
              </label>

              <fieldset className="links-field">
                <legend>Links</legend>
                <div className="field-heading">
                  <small>Paste a URL and the label can be filled in automatically.</small>
                  <button className="add-link-button" onClick={addLink} type="button">
                    <Plus size={15} />
                    Add link
                  </button>
                </div>
                {(draft.links ?? []).length === 0 ? (
                  <p>No links added yet.</p>
                ) : (
                  <div className="link-list">
                    {(draft.links ?? []).map((link, index) => (
                      <div className="link-row" key={index}>
                        <label>
                          <span>Label</span>
                          <input
                            onChange={(event) =>
                              updateLink(index, 'label', event.target.value)
                            }
                            placeholder="Design spec"
                            value={link.label}
                          />
                        </label>
                        <label>
                          <span>Link</span>
                          <input
                            onChange={(event) =>
                              updateLink(index, 'url', event.target.value)
                            }
                            placeholder="https://example.com"
                            value={link.url}
                          />
                        </label>
                        <button
                          aria-label={`Remove link ${index + 1}`}
                          className="link-remove"
                          onClick={() => removeLink(index)}
                          type="button"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>

              <label>
                <span>Notes</span>
                <textarea
                  onChange={(event) => updateDraft('notes', event.target.value)}
                  placeholder="Context, constraints, or what clarity would look like."
                  value={draft.notes ?? ''}
                />
              </label>
            </div>

            <aside className="composer-sidebar" aria-label="Item priority">
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

          <div className="modal-actions">
            {isEditing && (
              <button
                className="danger-button"
                onClick={() => void deleteDraft()}
                type="button"
              >
                <Trash2 size={17} />
                Delete item
              </button>
            )}
            <div className="modal-action-group">
              <button className="quiet-button" onClick={onClose} type="button">
                Cancel
              </button>
              <button className="primary-action" type="submit">
                <Check size={18} />
                Save item
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
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
    <fieldset className="signal-selector">
      <legend>{label}</legend>
      <div className="signal-options" role="radiogroup">
        {options.map(({ Icon, detail, label: optionLabel, tone, value }) => {
          const isSelected = selected === value
          const tooltipId = `${label.toLowerCase()}-${value}-tooltip`

          return (
            <button
              aria-checked={isSelected}
              aria-describedby={tooltipId}
              className={`signal-option ${tone} ${isSelected ? 'is-selected' : ''}`}
              key={value}
              onClick={() => onSelect(value)}
              role="radio"
              title={detail}
              type="button"
            >
              <span className="signal-icon">
                <Icon size={15} strokeWidth={2.3} />
              </span>
              <span>
                <strong>{optionLabel}</strong>
              </span>
              <span className="signal-tooltip" id={tooltipId} role="tooltip">
                {detail}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function CloseSection({
  children,
  kicker,
  prompt,
  title,
}: {
  children: React.ReactNode
  kicker: string
  prompt: string
  title: string
}) {
  return (
    <article className="close-section">
      <span className="step-kicker">{kicker}</span>
      <h2>{title}</h2>
      <p>{prompt}</p>
      <div className="close-section-body">{children}</div>
    </article>
  )
}

function SuggestionList({ empty, titles }: { empty: string; titles: string[] }) {
  if (titles.length === 0) {
    return <p className="soft-note">{empty}</p>
  }

  return (
    <ul className="suggestion-list">
      {titles.map((title) => (
        <li key={title}>{title}</li>
      ))}
    </ul>
  )
}

function SelectableList({
  onChange,
  selected,
  titles,
}: {
  onChange: (titles: string[]) => void
  selected: string[]
  titles: string[]
}) {
  if (titles.length === 0) {
    return <p className="soft-note">Nothing suggested here.</p>
  }

  return (
    <div className="selectable-list">
      {titles.map((title) => {
        const isChecked = selected.includes(title)
        return (
          <label key={title}>
            <input
              checked={isChecked}
              onChange={() => {
                onChange(
                  isChecked
                    ? selected.filter((item) => item !== title)
                    : [...selected, title],
                )
              }}
              type="checkbox"
            />
            <span>{title}</span>
          </label>
        )
      })}
    </div>
  )
}

function groupByCategory(items: WorkItem[]) {
  return categories.reduce(
    (grouped, category) => ({
      ...grouped,
      [category]: sortWorkItems(
        items.filter((item) => item.category === category),
      ),
    }),
    {} as Record<WorkCategory, WorkItem[]>,
  )
}

function sortWorkItems(items: WorkItem[]) {
  const sorted = [...items].sort(compareWorkItems)

  for (let pass = 0; pass < sorted.length; pass += 1) {
    let moved = false

    for (const item of [...sorted]) {
      if (!item.displaces) continue

      const itemIndex = sorted.findIndex((candidate) => candidate.id === item.id)
      const displacedIndex = sorted.findIndex(
        (candidate) => candidate.title === item.displaces,
      )

      if (itemIndex === -1 || displacedIndex === -1 || itemIndex <= displacedIndex) {
        continue
      }

      const [displacingItem] = sorted.splice(itemIndex, 1)
      const newDisplacedIndex = sorted.findIndex(
        (candidate) => candidate.title === item.displaces,
      )
      sorted.splice(newDisplacedIndex, 0, displacingItem)
      moved = true
    }

    if (!moved) break
  }

  return sorted
}

function compareWorkItems(first: WorkItem, second: WorkItem) {
  const urgencyDelta =
    getUrgencyRank(first.urgency) - getUrgencyRank(second.urgency)
  if (urgencyDelta !== 0) return urgencyDelta

  const impactDelta = getImpactRank(first.impact) - getImpactRank(second.impact)
  if (impactDelta !== 0) return impactDelta

  return first.createdAt - second.createdAt
}

function getUrgencyRank(urgency?: Urgency) {
  return urgency ? urgencySortRank[urgency] : Number.MAX_SAFE_INTEGER
}

function getImpactRank(impact?: Impact) {
  return impact ? impactSortRank[impact] : Number.MAX_SAFE_INTEGER
}

function getSignalOption<Value extends string>(
  options: Array<SignalOption<Value>>,
  value?: Value,
) {
  return value ? options.find((option) => option.value === value) : undefined
}

function normalizeWorkLinks(links?: WorkLink[]) {
  return (links ?? []).reduce<WorkLink[]>((normalizedLinks, link) => {
    const url = normalizeLinkUrl(link.url)
    if (!url) return normalizedLinks

    normalizedLinks.push({
      label: link.label.trim() || deriveLinkLabel(url),
      url,
    })
    return normalizedLinks
  }, [])
}

function normalizeLinkUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

function deriveLinkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Link'
  }
}

function needsPrioritization(item: WorkItem) {
  return (
    item.category === 'borrowed_fire' ||
    item.category === 'noise' ||
    item.urgency === 'unclear' ||
    !item.requestedBy ||
    !item.displaces
  )
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function buildMarkdownSummary({
  date,
  finished,
  firstStepTomorrow,
  needsPrioritization: decisions,
  stillOpen,
}: {
  date: string
  finished: string[]
  firstStepTomorrow?: string
  needsPrioritization: string[]
  stillOpen: string[]
}) {
  return [
    `## Daily Close — ${date}`,
    '',
    '### Finished Today',
    ...markdownList(finished),
    '',
    '### Still Open',
    ...markdownList(stillOpen),
    '',
    '### Needs Prioritization',
    ...markdownList(decisions),
    '',
    '### First Step Tomorrow',
    `- ${firstStepTomorrow?.trim() || 'No first step set yet.'}`,
  ].join('\n')
}

function markdownList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`) : ['- None named.']
}

function getLocalDateKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLongDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
  }).format(new Date(year, month - 1, day))
}

export default App

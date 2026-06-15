import { AppHeader } from '@/components/app/AppHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  codeBlockClass,
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
  mainClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  softNoteClass,
  textareaClass,
} from '@/lib/appStyles'
import { copyText } from '@/lib/clipboard'
import { createDailyClose, listWorkItemsByDate } from '@/lib/data'
import { formatLongDate, getLocalDateKey } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ArrowLeft, ClipboardCopy, ListChecks } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, WorkItem } from '../../lib/types'
import {
  buildMarkdownSummary,
  getDailyCloseDefaults,
  splitLines,
} from './dailyCloseRules'
import { needsPrioritization } from '../work-items/workItemRules'

export function DailyClosePage({ project }: { project: Project }) {
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
      const loadedItems = await listWorkItemsByDate(project.id, today)
      const defaults = getDailyCloseDefaults(loadedItems)
      setItems(loadedItems)
      setStillOpen(defaults.stillOpen)
      setNeedsDecision(defaults.needsDecision)
    }

    void loadItems()
  }, [project.id, today])

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
      projectName: project.name,
    })

    await createDailyClose({
      date: today,
      finished: finishedTitles,
      stillOpen,
      needsPrioritization: needsDecision,
      firstStepTomorrow,
      markdownSummary,
      projectId: project.id,
    })
    setSummary(markdownSummary)
  }

  async function copySummary() {
    const didCopy = await copyText(summary)
    setCopyLabel(didCopy ? 'Copied' : 'Copy failed')
    window.setTimeout(() => setCopyLabel('Copy Markdown'), 1600)
  }

  return (
    <main className={mainClass}>
      <AppHeader subtitle="You can leave work unfinished without carrying it all night." />
      <div className="grid justify-items-start gap-3.5">
        <Button
          className={secondaryButtonClass}
          onClick={() => navigate('/')}
          type="button"
          variant="outline"
        >
          <ArrowLeft size={17} />
          Back to today
        </Button>
        <h1 className="max-w-[14ch]">Close the day with clarity.</h1>
        <p className="max-w-[64ch] text-[var(--text-secondary)]">
          This is a short reset: name what moved, release what remains, and pick
          one first step for tomorrow.
        </p>
      </div>

      <section className="grid gap-3.5 sm:grid-cols-2">
        <CloseSection
          kicker="1"
          prompt="What did you finish, move forward, unblock, or clarify today?"
          title="Finished today"
        >
          <SuggestionList titles={finishedTitles} empty="No completed items yet." />
          <Label className={fieldLabelClass} htmlFor="extra-finished">
            Add invisible work
          </Label>
          <Textarea
            className={textareaClass}
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
          <Input
            className={fieldClass}
            onChange={(event) => setFirstStepTomorrow(event.target.value)}
            placeholder="Example: Ask Marta whether the report replaces sprint planning."
            value={firstStepTomorrow}
          />
        </CloseSection>
      </section>

      <div className="flex flex-wrap items-center gap-2.5 max-md:w-full">
        <Button
          className={cn(primaryButtonClass, 'max-md:flex-1')}
          onClick={completeClose}
          type="button"
        >
          <ListChecks size={18} />
          Generate Daily Close
        </Button>
      </div>

      {summary && (
        <Card className={cn(panelClass, 'grid gap-4 p-5 md:grid-cols-[1fr_auto]')}>
          <div>
            <p className={eyebrowClass}>Markdown summary</p>
            <h2>Ready to carry forward.</h2>
          </div>
          <Button
            className={secondaryButtonClass}
            onClick={copySummary}
            type="button"
            variant="outline"
          >
            <ClipboardCopy size={18} />
            {copyLabel}
          </Button>
          <pre className={codeBlockClass}>{summary}</pre>
        </Card>
      )}
    </main>
  )
}

function CloseSection({
  children,
  kicker,
  prompt,
  title,
}: {
  children: ReactNode
  kicker: string
  prompt: string
  title: string
}) {
  return (
    <Card className={cn(panelClass, 'p-5')}>
      <span className="mb-3 inline-flex size-[30px] items-center justify-center rounded-full bg-[var(--commitment-bg)] font-extrabold text-[var(--commitment)]">
        {kicker}
      </span>
      <h2>{title}</h2>
      <p className="mt-2 text-[var(--text-secondary)]">{prompt}</p>
      <CardContent className="mt-4 grid gap-3 p-0">{children}</CardContent>
    </Card>
  )
}

function SuggestionList({ empty, titles }: { empty: string; titles: string[] }) {
  if (titles.length === 0) {
    return <p className={softNoteClass}>{empty}</p>
  }

  return (
    <ul className="grid list-none gap-2 p-0">
      {titles.map((title) => (
        <li
          className="rounded-lg border border-[var(--border)] bg-[#fbfaf7] px-3 py-2.5"
          key={title}
        >
          {title}
        </li>
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
    return <p className={softNoteClass}>Nothing suggested here.</p>
  }

  return (
    <div className="grid gap-2">
      {titles.map((title) => {
        const isChecked = selected.includes(title)
        return (
          <Label
            className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[#fbfaf7] px-3 py-2.5"
            key={title}
          >
            <Checkbox
              checked={isChecked}
              className="border-[var(--border)] data-checked:border-[var(--app-accent)] data-checked:bg-[var(--app-accent)]"
              onCheckedChange={() => {
                onChange(
                  isChecked
                    ? selected.filter((item) => item !== title)
                    : [...selected, title],
                )
              }}
            />
            <span>{title}</span>
          </Label>
        )
      })}
    </div>
  )
}

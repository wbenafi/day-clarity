import type { SignalTone } from '@/lib/appStyles'
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Gauge,
  HelpCircle,
  Minus,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BoardSection, Impact, Urgency, WorkItem, WorkLink } from '../../lib/types'

export type SignalOption<Value extends string> = {
  Icon: LucideIcon
  detail: string
  label: string
  tone: SignalTone
  value: Value
}

export const urgencyLabels: Record<Urgency, string> = {
  today: 'Today',
  this_week: 'This week',
  unclear: 'Unclear',
  later: 'Later',
}

export const impactLabels: Record<Impact, string> = {
  low: 'Low impact',
  medium: 'Medium impact',
  high: 'High impact',
}

export const urgencyOptions: Array<SignalOption<Urgency>> = [
  {
    Icon: Clock,
    detail: 'Needs attention before the day ends.',
    label: 'Today',
    tone: 'realFire',
    value: 'today',
  },
  {
    Icon: CalendarDays,
    detail: 'Relevant soon, but not a fire.',
    label: 'This week',
    tone: 'commitment',
    value: 'this_week',
  },
  {
    Icon: HelpCircle,
    detail: 'Needs a decision before effort.',
    label: 'Unclear',
    tone: 'noise',
    value: 'unclear',
  },
  {
    Icon: ArrowRight,
    detail: 'Can wait without being carried.',
    label: 'Later',
    tone: 'later',
    value: 'later',
  },
]

export const impactOptions: Array<SignalOption<Impact>> = [
  {
    Icon: Minus,
    detail: 'Small consequence if delayed.',
    label: 'Low',
    tone: 'noise',
    value: 'low',
  },
  {
    Icon: Gauge,
    detail: 'Meaningful, but bounded.',
    label: 'Medium',
    tone: 'borrowedFire',
    value: 'medium',
  },
  {
    Icon: TrendingUp,
    detail: 'High consequence or leverage.',
    label: 'High',
    tone: 'realFire',
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

export function groupByCategory(items: WorkItem[], sections: BoardSection[]) {
  return sections.reduce(
    (grouped, category) => ({
      ...grouped,
      [category.id]: sortWorkItems(
        items.filter((item) => item.category === category.id),
      ),
    }),
    {} as Record<string, WorkItem[]>,
  )
}

export function sortWorkItems(items: WorkItem[]) {
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

export function getSignalOption<Value extends string>(
  options: Array<SignalOption<Value>>,
  value?: Value,
) {
  return value ? options.find((option) => option.value === value) : undefined
}

export function normalizeWorkLinks(links?: WorkLink[]) {
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

export function needsPrioritization(item: WorkItem) {
  return (
    item.category === 'borrowed_fire' ||
    item.category === 'noise' ||
    item.urgency === 'unclear' ||
    !item.requestedBy ||
    !item.displaces
  )
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

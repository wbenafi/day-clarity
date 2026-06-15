import type { WorkItem } from '@/lib/types'
import { needsPrioritization } from '../work-items/workItemRules'

export function getDailyCloseDefaults(items: WorkItem[]) {
  const openItems = items.filter((item) => item.status === 'open')

  return {
    stillOpen: openItems.map((item) => item.title),
    needsDecision: openItems
      .filter((item) => needsPrioritization(item))
      .map((item) => item.title),
  }
}

export function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function buildMarkdownSummary({
  date,
  finished,
  firstStepTomorrow,
  needsPrioritization: decisions,
  projectName,
  stillOpen,
}: {
  date: string
  finished: string[]
  firstStepTomorrow?: string
  needsPrioritization: string[]
  projectName: string
  stillOpen: string[]
}) {
  return [
    `## Daily Close — ${projectName} — ${date}`,
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

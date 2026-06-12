import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import type { DailyClose, NewDailyClose, NewWorkItem, WorkItem } from './types'

const workItemsKey = 'dayclarity.workItems'
const dailyClosesKey = 'dayclarity.dailyCloses'
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null

const convexRefs = {
  archiveWorkItem: makeFunctionReference<'mutation', { id: string }>(
    'workItems:archiveWorkItem',
  ),
  createDailyClose: makeFunctionReference<'mutation', NewDailyClose, DailyClose>(
    'dailyCloses:createDailyClose',
  ),
  createWorkItem: makeFunctionReference<'mutation', NewWorkItem, WorkItem>(
    'workItems:createWorkItem',
  ),
  listDailyCloses: makeFunctionReference<'query', Record<string, never>, DailyClose[]>(
    'dailyCloses:listDailyCloses',
  ),
  listWorkItemsByDate: makeFunctionReference<
    'query',
    { date: string },
    WorkItem[]
  >('workItems:listWorkItemsByDate'),
  reopenWorkItem: makeFunctionReference<'mutation', { id: string }, WorkItem>(
    'workItems:reopenWorkItem',
  ),
  updateWorkItem: makeFunctionReference<'mutation', WorkItem, WorkItem>(
    'workItems:updateWorkItem',
  ),
}

export async function listWorkItemsByDate(date: string) {
  if (convexClient) {
    return convexClient.query(convexRefs.listWorkItemsByDate, { date })
  }

  return readStore<WorkItem>(workItemsKey)
    .filter((item) => item.date === date && item.status !== 'archived')
    .sort((first, second) => first.createdAt - second.createdAt)
}

export async function createWorkItem(item: NewWorkItem) {
  if (convexClient) {
    return convexClient.mutation(convexRefs.createWorkItem, normalizeOptional(item))
  }

  const now = Date.now()
  const created: WorkItem = {
    ...normalizeOptional(item),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  writeStore(workItemsKey, [...readStore<WorkItem>(workItemsKey), created])
  return created
}

export async function updateWorkItem(item: WorkItem) {
  if (convexClient) {
    return convexClient.mutation(convexRefs.updateWorkItem, normalizeOptional(item))
  }

  const updated = { ...normalizeOptional(item), updatedAt: Date.now() }
  writeStore(
    workItemsKey,
    readStore<WorkItem>(workItemsKey).map((storedItem) =>
      storedItem.id === item.id ? updated : storedItem,
    ),
  )
  return updated
}

export async function archiveWorkItem(id: string) {
  if (convexClient) {
    await convexClient.mutation(convexRefs.archiveWorkItem, { id })
    return
  }

  writeStore(
    workItemsKey,
    readStore<WorkItem>(workItemsKey).map((item) =>
      item.id === id
        ? { ...item, status: 'archived', updatedAt: Date.now() }
        : item,
    ),
  )
}

export async function reopenWorkItem(id: string) {
  if (convexClient) {
    return convexClient.mutation(convexRefs.reopenWorkItem, { id })
  }

  const item = readStore<WorkItem>(workItemsKey).find((storedItem) => storedItem.id === id)
  if (!item) return null

  const updated = { ...item, status: 'open' as const, completedAt: undefined, updatedAt: Date.now() }
  await updateWorkItem(updated)
  return updated
}

export async function createDailyClose(close: NewDailyClose) {
  if (convexClient) {
    return convexClient.mutation(convexRefs.createDailyClose, normalizeOptional(close))
  }

  const now = Date.now()
  const existing = readStore<DailyClose>(dailyClosesKey)
  const previous = existing.find((storedClose) => storedClose.date === close.date)
  const next: DailyClose = {
    ...normalizeOptional(close),
    id: previous?.id ?? crypto.randomUUID(),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }

  writeStore(dailyClosesKey, [
    ...existing.filter((storedClose) => storedClose.date !== close.date),
    next,
  ])
  return next
}

export async function listDailyCloses() {
  if (convexClient) {
    return convexClient.query(convexRefs.listDailyCloses, {})
  }

  return readStore<DailyClose>(dailyClosesKey).sort(
    (first, second) => second.createdAt - first.createdAt,
  )
}

function readStore<T>(key: string) {
  const raw = window.localStorage.getItem(key)
  if (!raw) return []

  try {
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function writeStore<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeOptional<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === 'string' && entry.trim() === '' ? undefined : entry,
    ]),
  ) as T
}

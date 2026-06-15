import type { DailyClose, NewDailyClose, NewWorkItem, Project, WorkItem } from '../types'
import { normalizeOptional } from './optional'

const defaultProjectName = 'Initial Project'
const legacyDefaultProjectName = 'Default'
const workItemsKey = 'dayclarity.workItems'
const dailyClosesKey = 'dayclarity.dailyCloses'
const projectsKey = 'dayclarity.projects'

type LegacyWorkItem = Omit<WorkItem, 'projectId'> & { projectId?: string }
type LegacyDailyClose = Omit<DailyClose, 'projectId'> & { projectId?: string }

export async function ensureDefaultProject() {
  const now = Date.now()
  const projects = readStore<Project>(projectsKey)
  let defaultProject = projects.find(
    (project) => project.name === defaultProjectName && !project.archivedAt,
  )
  const legacyDefaultProject = projects.find(
    (project) => project.name === legacyDefaultProjectName && !project.archivedAt,
  )

  if (!defaultProject && legacyDefaultProject) {
    defaultProject = {
      ...legacyDefaultProject,
      name: defaultProjectName,
      updatedAt: now,
    }
    writeStore(
      projectsKey,
      projects.map((project) =>
        project.id === defaultProject?.id ? defaultProject : project,
      ),
    )
  } else if (!defaultProject) {
    defaultProject = {
      id: crypto.randomUUID(),
      name: defaultProjectName,
      createdAt: now,
      updatedAt: now,
    }
    writeStore(projectsKey, [...projects, defaultProject])
  }

  backfillLocalProjectIds(defaultProject.id)
  return defaultProject
}

export async function listProjects() {
  const projects = readStore<Project>(projectsKey).filter(
    (project) => !project.archivedAt,
  )

  if (projects.length === 0) {
    return [await ensureDefaultProject()]
  }

  return projects.sort((first, second) => first.createdAt - second.createdAt)
}

export async function createProject(name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Project name is required.')

  const now = Date.now()
  const project: Project = {
    id: crypto.randomUUID(),
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
  }
  writeStore(projectsKey, [...readStore<Project>(projectsKey), project])
  return project
}

export async function updateProject(project: Project) {
  const trimmedName = project.name.trim()
  if (!trimmedName) throw new Error('Project name is required.')

  const updatedProject: Project = {
    ...project,
    name: trimmedName,
    updatedAt: Date.now(),
  }

  writeStore(
    projectsKey,
    readStore<Project>(projectsKey).map((storedProject) =>
      storedProject.id === updatedProject.id ? updatedProject : storedProject,
    ),
  )
  return updatedProject
}

export async function listWorkItemsByDate(projectId: string, date: string) {
  return readStore<WorkItem>(workItemsKey)
    .filter(
      (item) =>
        item.projectId === projectId &&
        item.status !== 'archived' &&
        (item.date === date || (item.status === 'open' && item.date < date)),
    )
    .sort((first, second) => first.createdAt - second.createdAt)
}

export async function createWorkItem(item: NewWorkItem) {
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
  writeStore(
    workItemsKey,
    readStore<WorkItem>(workItemsKey).map((item) =>
      item.id === id ? { ...item, status: 'archived', updatedAt: Date.now() } : item,
    ),
  )
}

export async function reopenWorkItem(id: string) {
  const item = readStore<WorkItem>(workItemsKey).find(
    (storedItem) => storedItem.id === id,
  )
  if (!item) return null

  const updated = {
    ...item,
    status: 'open' as const,
    completedAt: undefined,
    updatedAt: Date.now(),
  }
  await updateWorkItem(updated)
  return updated
}

export async function createDailyClose(close: NewDailyClose) {
  const now = Date.now()
  const existing = readStore<DailyClose>(dailyClosesKey)
  const previous = existing.find(
    (storedClose) =>
      storedClose.projectId === close.projectId && storedClose.date === close.date,
  )
  const next: DailyClose = {
    ...normalizeOptional(close),
    id: previous?.id ?? crypto.randomUUID(),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }

  writeStore(dailyClosesKey, [
    ...existing.filter(
      (storedClose) =>
        storedClose.projectId !== close.projectId || storedClose.date !== close.date,
    ),
    next,
  ])
  return next
}

export async function listDailyCloses(projectId: string) {
  return readStore<DailyClose>(dailyClosesKey)
    .filter((close) => close.projectId === projectId)
    .sort((first, second) => second.createdAt - first.createdAt)
}

function backfillLocalProjectIds(projectId: string) {
  const workItems = readStore<LegacyWorkItem>(workItemsKey)
  if (workItems.some((item) => !item.projectId)) {
    writeStore<WorkItem>(
      workItemsKey,
      workItems.map((item) => ({
        ...item,
        projectId: item.projectId ?? projectId,
      })),
    )
  }

  const dailyCloses = readStore<LegacyDailyClose>(dailyClosesKey)
  if (dailyCloses.some((close) => !close.projectId)) {
    writeStore<DailyClose>(
      dailyClosesKey,
      dailyCloses.map((close) => ({
        ...close,
        projectId: close.projectId ?? projectId,
      })),
    )
  }
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

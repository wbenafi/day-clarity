import {
  cloneDefaultBoardSections,
  normalizeBoardSections,
} from '../boardSections'
import type {
  BoardSection,
  DailyClose,
  NewDailyClose,
  NewWorkItem,
  Project,
  WorkItem,
} from '../types'
import { normalizeOptional } from './optional'

const defaultProjectName = 'Initial Project'
const legacyDefaultProjectName = 'Default'
const workItemsKey = 'dayclarity.workItems'
const dailyClosesKey = 'dayclarity.dailyCloses'
const projectsKey = 'dayclarity.projects'

type LegacyProject = Omit<Project, 'boardSections'> & {
  boardSections?: BoardSection[]
}
type LegacyWorkItem = Omit<WorkItem, 'category' | 'projectId'> & {
  category?: string
  projectId?: string
}
type LegacyDailyClose = Omit<DailyClose, 'projectId'> & { projectId?: string }

export async function ensureDefaultProject() {
  const now = Date.now()
  const projects = readStore<LegacyProject>(projectsKey)
  const activeProjects = projects
    .filter((project) => !project.archivedAt)
    .sort((first, second) => first.createdAt - second.createdAt)
  let defaultProject = activeProjects.find(
    (project) => project.name === defaultProjectName && !project.archivedAt,
  )
  const legacyDefaultProject = activeProjects.find(
    (project) => project.name === legacyDefaultProjectName && !project.archivedAt,
  )

  if (!defaultProject && legacyDefaultProject && activeProjects.length === 1) {
    defaultProject = {
      ...legacyDefaultProject,
      boardSections: normalizeBoardSections(legacyDefaultProject.boardSections),
      name: defaultProjectName,
      updatedAt: now,
    }
    writeStore(
      projectsKey,
      projects.map((project) =>
        project.id === defaultProject?.id ? defaultProject : project,
      ),
    )
  } else if (!defaultProject && activeProjects.length > 0) {
    defaultProject = activeProjects[0]
  } else if (!defaultProject) {
    defaultProject = {
      id: crypto.randomUUID(),
      name: defaultProjectName,
      boardSections: cloneDefaultBoardSections(),
      createdAt: now,
      updatedAt: now,
    }
    writeStore(projectsKey, [...projects, defaultProject])
  }

  migrateLocalStorage(defaultProject.id)
  const migratedDefaultProject = readStore<Project>(projectsKey).find(
    (project) => project.id === defaultProject.id,
  )

  if (!migratedDefaultProject) throw new Error('Unable to create default project.')
  return migratedDefaultProject
}

export async function listProjects() {
  const existingProjects = readStore<LegacyProject>(projectsKey)

  if (existingProjects.length === 0) {
    return [await ensureDefaultProject()]
  }

  const defaultProject =
    existingProjects.find(
      (project) => project.name === defaultProjectName && !project.archivedAt,
    ) ?? existingProjects.find((project) => !project.archivedAt)
  if (defaultProject) migrateLocalStorage(defaultProject.id)

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
    boardSections: cloneDefaultBoardSections(),
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

export async function countWorkItemsBySection(projectId: string, sectionId: string) {
  return readStore<WorkItem>(workItemsKey).filter(
    (item) =>
      item.projectId === projectId &&
      item.category === sectionId &&
      item.status !== 'archived',
  ).length
}

export async function archiveWorkItemsBySection(
  projectId: string,
  sectionId: string,
) {
  const now = Date.now()
  writeStore(
    workItemsKey,
    readStore<WorkItem>(workItemsKey).map((item) =>
      item.projectId === projectId &&
      item.category === sectionId &&
      item.status !== 'archived'
        ? { ...item, status: 'archived', updatedAt: now }
        : item,
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

function migrateLocalStorage(defaultProjectId: string) {
  const projects = readStore<LegacyProject>(projectsKey)
  const migratedProjects = projects.map((project) => ({
    ...project,
    boardSections: normalizeBoardSections(project.boardSections),
  }))
  if (JSON.stringify(projects) !== JSON.stringify(migratedProjects)) {
    writeStore<Project>(projectsKey, migratedProjects)
  }

  backfillLocalWorkItems(defaultProjectId, migratedProjects)
  backfillLocalDailyCloses(defaultProjectId)
}

function backfillLocalWorkItems(defaultProjectId: string, projects: Project[]) {
  const workItems = readStore<LegacyWorkItem>(workItemsKey)
  const sectionsByProject = new Map(
    projects.map((project) => [
      project.id,
      new Set(project.boardSections.map((section) => section.id)),
    ]),
  )
  const firstSectionByProject = new Map(
    projects.map((project) => [project.id, project.boardSections[0]?.id]),
  )
  const migratedWorkItems = workItems.map((item) => {
    const projectId = item.projectId ?? defaultProjectId
    const sectionIds = sectionsByProject.get(projectId)
    const fallbackCategory =
      firstSectionByProject.get(projectId) ?? cloneDefaultBoardSections()[0].id
    const category =
      item.category && sectionIds?.has(item.category) ? item.category : fallbackCategory

    return {
      ...item,
      category,
      projectId,
    }
  })

  if (JSON.stringify(workItems) !== JSON.stringify(migratedWorkItems)) {
    writeStore<WorkItem>(workItemsKey, migratedWorkItems)
  }
}

function backfillLocalDailyCloses(projectId: string) {
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

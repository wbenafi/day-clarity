import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import type { DailyClose, NewDailyClose, NewWorkItem, Project, WorkItem } from '../types'
import { normalizeOptional } from './optional'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null

const convexRefs = {
  archiveWorkItem: makeFunctionReference<'mutation', { id: string }>(
    'workItems:archiveWorkItem',
  ),
  archiveWorkItemsBySection: makeFunctionReference<
    'mutation',
    { projectId: string; sectionId: string }
  >('workItems:archiveWorkItemsBySection'),
  countWorkItemsBySection: makeFunctionReference<
    'query',
    { projectId: string; sectionId: string },
    number
  >('workItems:countWorkItemsBySection'),
  createDailyClose: makeFunctionReference<'mutation', NewDailyClose, DailyClose>(
    'dailyCloses:createDailyClose',
  ),
  createProject: makeFunctionReference<'mutation', { name: string }, Project>(
    'projects:createProject',
  ),
  createWorkItem: makeFunctionReference<'mutation', NewWorkItem, WorkItem>(
    'workItems:createWorkItem',
  ),
  ensureDefaultProject: makeFunctionReference<
    'mutation',
    Record<string, never>,
    Project
  >('projects:ensureDefaultProject'),
  listDailyCloses: makeFunctionReference<
    'query',
    { projectId: string },
    DailyClose[]
  >('dailyCloses:listDailyCloses'),
  listProjects: makeFunctionReference<'query', Record<string, never>, Project[]>(
    'projects:listProjects',
  ),
  listWorkItemsByDate: makeFunctionReference<
    'query',
    { date: string; projectId: string },
    WorkItem[]
  >('workItems:listWorkItemsByDate'),
  reopenWorkItem: makeFunctionReference<'mutation', { id: string }, WorkItem>(
    'workItems:reopenWorkItem',
  ),
  updateProject: makeFunctionReference<'mutation', Project, Project>(
    'projects:updateProject',
  ),
  updateWorkItem: makeFunctionReference<'mutation', WorkItem, WorkItem>(
    'workItems:updateWorkItem',
  ),
}

export function hasConvexClient() {
  return Boolean(convexClient)
}

export async function ensureDefaultProject() {
  return convexClient!.mutation(convexRefs.ensureDefaultProject, {})
}

export async function listProjects() {
  return convexClient!.query(convexRefs.listProjects, {})
}

export async function createProject(name: string) {
  return convexClient!.mutation(convexRefs.createProject, { name })
}

export async function updateProject(project: Project) {
  return convexClient!.mutation(convexRefs.updateProject, project)
}

export async function listWorkItemsByDate(projectId: string, date: string) {
  return convexClient!.query(convexRefs.listWorkItemsByDate, { date, projectId })
}

export async function createWorkItem(item: NewWorkItem) {
  return convexClient!.mutation(convexRefs.createWorkItem, normalizeOptional(item))
}

export async function updateWorkItem(item: WorkItem) {
  return convexClient!.mutation(convexRefs.updateWorkItem, normalizeOptional(item))
}

export async function archiveWorkItem(id: string) {
  await convexClient!.mutation(convexRefs.archiveWorkItem, { id })
}

export async function countWorkItemsBySection(
  projectId: string,
  sectionId: string,
) {
  return convexClient!.query(convexRefs.countWorkItemsBySection, {
    projectId,
    sectionId,
  })
}

export async function archiveWorkItemsBySection(
  projectId: string,
  sectionId: string,
) {
  await convexClient!.mutation(convexRefs.archiveWorkItemsBySection, {
    projectId,
    sectionId,
  })
}

export async function reopenWorkItem(id: string) {
  return convexClient!.mutation(convexRefs.reopenWorkItem, { id })
}

export async function createDailyClose(close: NewDailyClose) {
  return convexClient!.mutation(convexRefs.createDailyClose, normalizeOptional(close))
}

export async function listDailyCloses(projectId: string) {
  return convexClient!.query(convexRefs.listDailyCloses, { projectId })
}

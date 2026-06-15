import * as convexData from './persistence/convexData'
import * as localData from './persistence/localData'
import type { DailyClose, NewDailyClose, NewWorkItem, Project, WorkItem } from './types'

export const activeProjectIdKey = 'dayclarity.activeProjectId'

const dataSource = convexData.hasConvexClient() ? convexData : localData

export function ensureDefaultProject() {
  return dataSource.ensureDefaultProject()
}

export function listProjects() {
  return dataSource.listProjects()
}

export function createProject(name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Project name is required.')
  return dataSource.createProject(trimmedName)
}

export function updateProject(project: Project) {
  return dataSource.updateProject(project)
}

export function listWorkItemsByDate(projectId: string, date: string) {
  return dataSource.listWorkItemsByDate(projectId, date)
}

export function createWorkItem(item: NewWorkItem) {
  return dataSource.createWorkItem(item)
}

export function updateWorkItem(item: WorkItem) {
  return dataSource.updateWorkItem(item)
}

export function archiveWorkItem(id: string) {
  return dataSource.archiveWorkItem(id)
}

export function createDailyClose(close: NewDailyClose) {
  return dataSource.createDailyClose(close)
}

export function listDailyCloses(projectId: string) {
  return dataSource.listDailyCloses(projectId)
}

export function reopenWorkItem(id: string) {
  return dataSource.reopenWorkItem(id)
}

export type { DailyClose, Project, WorkItem }

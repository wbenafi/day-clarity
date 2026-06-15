export type WorkCategory =
  | 'real_commitment'
  | 'real_fire'
  | 'borrowed_fire'
  | 'noise'

export type Urgency = 'today' | 'this_week' | 'unclear' | 'later'

export type Impact = 'low' | 'medium' | 'high'

export type WorkStatus = 'open' | 'done' | 'archived'

export type WorkLink = {
  label: string
  url: string
}

export type Project = {
  id: string
  name: string
  archivedAt?: number
  createdAt: number
  updatedAt: number
}

export type NewProject = Omit<Project, 'createdAt' | 'id' | 'updatedAt'>

export type WorkItem = {
  id: string
  projectId: string
  title: string
  category: WorkCategory
  urgency?: Urgency
  impact?: Impact
  requestedBy?: string
  displaces?: string
  links?: WorkLink[]
  notes?: string
  status: WorkStatus
  createdAt: number
  updatedAt: number
  completedAt?: number
  date: string
}

export type NewWorkItem = Omit<WorkItem, 'createdAt' | 'id' | 'updatedAt'>

export type DailyClose = {
  id: string
  projectId: string
  date: string
  finished: string[]
  stillOpen: string[]
  needsPrioritization: string[]
  firstStepTomorrow?: string
  markdownSummary: string
  createdAt: number
  updatedAt: number
}

export type NewDailyClose = Omit<DailyClose, 'createdAt' | 'id' | 'updatedAt'>

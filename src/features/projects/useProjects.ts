import {
  activeProjectIdKey,
  createProject,
  ensureDefaultProject,
  listProjects,
  updateProject,
} from '@/lib/data'
import type { Project } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

async function loadProjectSelection(preferredProjectId?: string) {
  const defaultProject = await ensureDefaultProject()
  const loadedProjects = await listProjects()
  const activeProjects = loadedProjects.filter((project) => !project.archivedAt)
  const storedProjectId =
    preferredProjectId ?? window.localStorage.getItem(activeProjectIdKey)
  const selectedProject =
    activeProjects.find((project) => project.id === storedProjectId) ??
    activeProjects.find((project) => project.id === defaultProject.id) ??
    [...activeProjects].sort(
      (first, second) => second.createdAt - first.createdAt,
    )[0] ??
    defaultProject

  return { activeProjects, selectedProject }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [isProjectLoading, setProjectLoading] = useState(true)
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isProjectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const refreshProjects = useCallback(async (preferredProjectId?: string) => {
    setProjectLoading(true)

    try {
      const { activeProjects, selectedProject } =
        await loadProjectSelection(preferredProjectId)
      setProjects(activeProjects)
      setActiveProject(selectedProject)
      window.localStorage.setItem(activeProjectIdKey, selectedProject.id)
    } finally {
      setProjectLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      const { activeProjects, selectedProject } = await loadProjectSelection()
      if (!isMounted) return

      setProjects(activeProjects)
      setActiveProject(selectedProject)
      window.localStorage.setItem(activeProjectIdKey, selectedProject.id)
      setProjectLoading(false)
    }

    void loadProjects()

    return () => {
      isMounted = false
    }
  }, [])

  function selectProject(project: Project) {
    setActiveProject(project)
    window.localStorage.setItem(activeProjectIdKey, project.id)
  }

  async function saveProjectName(name: string) {
    const project = editingProject
      ? await updateProject({ ...editingProject, name })
      : await createProject(name)

    setEditingProject(null)
    setProjectDialogOpen(false)
    await refreshProjects(project.id)
  }

  function openProjectCreator() {
    setEditingProject(null)
    setProjectDialogOpen(true)
    setSidebarOpen(true)
  }

  function openProjectEditor(project: Project) {
    setEditingProject(project)
    setProjectDialogOpen(true)
    setSidebarOpen(true)
  }

  function closeProjectDialog() {
    setEditingProject(null)
    setProjectDialogOpen(false)
  }

  return {
    activeProject,
    closeProjectDialog,
    editingProject,
    isProjectDialogOpen,
    isProjectLoading,
    isSidebarOpen,
    openProjectCreator,
    openProjectEditor,
    projects,
    saveProjectName,
    selectProject,
    setSidebarOpen,
  }
}

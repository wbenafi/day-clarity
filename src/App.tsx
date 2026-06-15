import { AppHeader } from '@/components/app/AppHeader'
import { DailyClosePage } from '@/features/daily-close/DailyClosePage'
import { HistoryPage } from '@/features/daily-close/HistoryPage'
import { ProjectDialog } from '@/features/projects/ProjectDialog'
import { ProjectSidebar } from '@/features/projects/ProjectSidebar'
import { useProjects } from '@/features/projects/useProjects'
import { TodayPage } from '@/features/work-items/TodayPage'
import { mainClass, pageShellClass, softNoteClass } from '@/lib/appStyles'
import { cn } from '@/lib/utils'
import { Route, Routes } from 'react-router-dom'

function App() {
  const {
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
  } = useProjects()

  return (
    <div
      className={cn(
        'grid min-h-svh w-full min-w-0 overflow-x-hidden transition-[grid-template-columns] duration-200',
        isSidebarOpen
          ? 'grid-cols-[260px_minmax(0,1fr)]'
          : 'grid-cols-[72px_minmax(0,1fr)]',
      )}
    >
      <ProjectSidebar
        activeProject={activeProject}
        isExpanded={isSidebarOpen}
        isLoading={isProjectLoading}
        onCreateProject={openProjectCreator}
        onEditProject={openProjectEditor}
        onSelectProject={selectProject}
        onToggle={() => setSidebarOpen((isOpen) => !isOpen)}
        projects={projects}
      />

      <div className={pageShellClass}>
        {activeProject ? (
          <Routes>
            <Route
              path="/"
              element={<TodayPage key={activeProject.id} project={activeProject} />}
            />
            <Route
              path="/close"
              element={
                <DailyClosePage key={activeProject.id} project={activeProject} />
              }
            />
            <Route
              path="/history"
              element={<HistoryPage key={activeProject.id} project={activeProject} />}
            />
          </Routes>
        ) : (
          <main className={mainClass}>
            <AppHeader subtitle="Loading projects..." />
            <p className={softNoteClass}>Preparing your projects.</p>
          </main>
        )}
      </div>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        key={editingProject?.id ?? 'new-project'}
        project={editingProject}
        onClose={closeProjectDialog}
        onSave={saveProjectName}
      />
    </div>
  )
}

export default App

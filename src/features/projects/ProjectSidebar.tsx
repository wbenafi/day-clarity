import { Button } from '@/components/ui/button'
import { softNoteClass } from '@/lib/appStyles'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/types'
import { ArrowLeft, ArrowRight, Pencil, Plus } from 'lucide-react'

export function ProjectSidebar({
  activeProject,
  isExpanded,
  isLoading,
  onCreateProject,
  onEditProject,
  onSelectProject,
  onToggle,
  projects,
}: {
  activeProject: Project | null
  isExpanded: boolean
  isLoading: boolean
  onCreateProject: () => void
  onEditProject: (project: Project) => void
  onSelectProject: (project: Project) => void
  onToggle: () => void
  projects: Project[]
}) {
  return (
    <aside
      className={cn(
        'sticky top-0 grid min-h-svh content-start gap-3.5 border-r border-[var(--border)] bg-white/70 px-3 py-[18px]',
        !isExpanded && 'justify-items-center',
      )}
      aria-label="Projects"
    >
      <Button
        aria-label={isExpanded ? 'Collapse projects' : 'Expand projects'}
        className="size-[42px] rounded-lg border border-[var(--border)] bg-white/80 text-[var(--text-secondary)] hover:bg-white"
        onClick={onToggle}
        size="icon"
        type="button"
        variant="outline"
      >
        {isExpanded ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
      </Button>

      <div
        className={cn('grid min-w-0 gap-2', !isExpanded && 'justify-items-center')}
        aria-label="Project list"
      >
        {isLoading ? (
          <p className={cn(softNoteClass, isExpanded ? '' : 'sr-only')}>
            Loading projects...
          </p>
        ) : (
          projects.map((project) => {
            const isActive = activeProject?.id === project.id

            return (
              <div
                className={cn(
                  'grid items-center gap-1.5 rounded-lg border border-transparent p-1.5',
                  isExpanded
                    ? 'grid-cols-[minmax(0,1fr)_auto]'
                    : 'grid-cols-1 justify-items-center p-1',
                  isActive &&
                    'border-[rgba(81,96,76,0.42)] bg-[rgba(231,236,227,0.68)] shadow-[0_8px_18px_rgba(63,52,34,0.07)]',
                )}
                key={project.id}
              >
                <Button
                  aria-label={isExpanded ? undefined : `Switch to ${project.name}`}
                  className={cn(
                    'h-auto justify-start gap-2.5 rounded-lg bg-transparent p-0 text-left font-[760] text-[var(--text-primary)] hover:bg-transparent',
                    !isExpanded && 'size-[42px] justify-center',
                  )}
                  onClick={() => onSelectProject(project)}
                  title={isExpanded ? undefined : project.name}
                  type="button"
                  variant="ghost"
                >
                  <span
                    className={cn(
                      'inline-flex size-[42px] shrink-0 items-center justify-center rounded-lg bg-[var(--commitment-bg)] font-[850] text-[var(--app-accent)]',
                      !isExpanded && 'size-[34px]',
                    )}
                  >
                    {getProjectInitial(project)}
                  </span>
                  {isExpanded && (
                    <span className="block min-w-0 truncate">{project.name}</span>
                  )}
                </Button>

                {isExpanded && (
                  <Button
                    aria-label={`Rename ${project.name}`}
                    className="size-[34px] rounded-lg text-[var(--text-secondary)] hover:bg-[rgba(81,96,76,0.08)] hover:text-[var(--app-accent)]"
                    onClick={() => onEditProject(project)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Pencil size={16} />
                  </Button>
                )}
              </div>
            )
          })
        )}
      </div>

      <Button
        aria-label={isExpanded ? undefined : 'New project'}
        className={cn(
          'h-auto min-h-[42px] rounded-lg border border-[rgba(81,96,76,0.18)] bg-[rgba(81,96,76,0.08)] px-3 py-2.5 font-[780] text-[var(--app-accent)] hover:bg-[rgba(81,96,76,0.13)]',
          !isExpanded && 'size-[42px] p-0',
        )}
        onClick={onCreateProject}
        title={isExpanded ? undefined : 'New project'}
        type="button"
        variant="outline"
      >
        <Plus size={16} />
        {isExpanded && <span>New project</span>}
      </Button>
    </aside>
  )
}

function getProjectInitial(project: Project) {
  return project.name.trim().charAt(0).toUpperCase() || '?'
}

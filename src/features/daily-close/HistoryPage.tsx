import { AppHeader } from '@/components/app/AppHeader'
import { ScreenHeader } from '@/components/app/ScreenHeader'
import { Card } from '@/components/ui/card'
import {
  codeBlockClass,
  eyebrowClass,
  mainClass,
  panelClass,
} from '@/lib/appStyles'
import { listDailyCloses } from '@/lib/data'
import { formatLongDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { History } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DailyClose, Project } from '../../lib/types'

export function HistoryPage({ project }: { project: Project }) {
  const [closes, setCloses] = useState<DailyClose[]>([])

  useEffect(() => {
    async function loadCloses() {
      setCloses(await listDailyCloses(project.id))
    }

    void loadCloses()
  }, [project.id])

  return (
    <main className={mainClass}>
      <AppHeader subtitle="A record of days you chose to put down." />
      <ScreenHeader
        backLabel="Back to today"
        backTo="/"
        title="Daily Close history"
        description="Previous summaries stay here for reflection, not judgment."
      />

      <section className="grid gap-4">
        {closes.length === 0 ? (
          <Card
            className={cn(
              panelClass,
              'grid justify-items-center p-[48px_20px] text-center',
            )}
          >
            <History className="mb-3 text-[var(--app-accent)]" size={25} />
            <h2 className="mb-1.5">No daily closes yet.</h2>
            <p className="text-[var(--text-secondary)]">
              Run your first Daily Close when the workday is ready to end.
            </p>
          </Card>
        ) : (
          closes.map((close) => (
            <Card className={cn(panelClass, 'p-5')} key={close.id}>
              <p className={eyebrowClass}>{formatLongDate(close.date)}</p>
              <pre className={codeBlockClass}>{close.markdownSummary}</pre>
            </Card>
          ))
        )}
      </section>
    </main>
  )
}

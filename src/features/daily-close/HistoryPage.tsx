import { AppHeader } from '@/components/app/AppHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  codeBlockClass,
  eyebrowClass,
  mainClass,
  panelClass,
  secondaryButtonClass,
} from '@/lib/appStyles'
import { listDailyCloses } from '@/lib/data'
import { formatLongDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { ArrowLeft, History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
      <div className="grid justify-items-start gap-3.5">
        <Button asChild className={secondaryButtonClass} variant="outline">
          <Link to="/">
            <ArrowLeft size={17} />
            Back to today
          </Link>
        </Button>
        <h1 className="max-w-[14ch]">Daily Close history</h1>
        <p className="text-[var(--text-secondary)]">
          Previous summaries stay here for reflection, not judgment.
        </p>
      </div>

      <section className="grid gap-3">
        {closes.length === 0 ? (
          <Card
            className={cn(
              panelClass,
              'grid justify-items-center p-[52px_20px] text-center',
            )}
          >
            <History className="mb-3.5 text-[var(--app-accent)]" size={26} />
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

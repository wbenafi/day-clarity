import { Button } from '@/components/ui/button'
import { secondaryButtonClass } from '@/lib/appStyles'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type ScreenHeaderProps = {
  backLabel?: string
  backTo?: string
  description: string
  title: string
}

export function ScreenHeader({
  backLabel = 'Back',
  backTo,
  description,
  title,
}: ScreenHeaderProps) {
  return (
    <section className="grid max-w-[68ch] justify-items-start gap-3">
      {backTo ? (
        <Button asChild className={secondaryButtonClass} variant="outline">
          <Link to={backTo}>
            <ArrowLeft size={17} />
            {backLabel}
          </Link>
        </Button>
      ) : null}
      <div className="grid gap-2">
        <h1 className="max-w-[15ch]">{title}</h1>
        <p className="max-w-[62ch] text-[0.98rem] leading-[1.48] text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </section>
  )
}

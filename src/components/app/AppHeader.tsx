import { formatLongDate, getLocalDateKey } from '@/lib/date'
import { cn } from '@/lib/utils'
import { Link, NavLink } from 'react-router-dom'

export function AppHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="grid items-center gap-4 py-[6px] pb-3.5 md:grid-cols-[auto_1fr_auto]">
      <Link className="inline-flex items-center gap-3 no-underline" to="/">
        <span className="inline-flex size-[42px] items-center justify-center overflow-hidden rounded-xl shadow-[0_10px_22px_rgba(63,77,60,0.2)]">
          <img alt="" className="block size-full" src="app-icon.png" />
        </span>
        <span>
          <strong className="block text-[1.02rem] tracking-normal">DayClarity</strong>
          <small className="block text-xs text-[var(--text-secondary)]">
            {formatLongDate(getLocalDateKey())}
          </small>
        </span>
      </Link>
      <p className="text-sm text-[var(--text-secondary)] md:text-center">
        {subtitle}
      </p>
      <nav
        aria-label="Primary navigation"
        className="flex max-w-full justify-self-start overflow-x-auto rounded-full border border-[var(--border)] bg-white/70 p-1 md:justify-self-auto"
      >
        {[
          ['/', 'Today'],
          ['/close', 'Daily Close'],
          ['/history', 'History'],
        ].map(([to, label]) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                'rounded-full px-[13px] py-2 text-sm text-[var(--text-secondary)] no-underline transition-colors',
                isActive &&
                  'bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_6px_14px_rgba(48,39,24,0.08)]',
              )
            }
            key={to}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

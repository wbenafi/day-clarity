import { cn } from '@/lib/utils'

export type CategoryTone = 'commitment' | 'realFire' | 'borrowedFire' | 'noise'
export type SignalTone = CategoryTone | 'later'

export const toneStyles: Record<
  SignalTone,
  { bg: string; border: string; selectedBg: string; text: string }
> = {
  commitment: {
    bg: 'bg-[rgba(231,236,227,0.72)]',
    border: 'border-[rgba(81,96,76,0.22)]',
    selectedBg: 'bg-[var(--commitment)]',
    text: 'text-[var(--commitment)]',
  },
  realFire: {
    bg: 'bg-[rgba(247,232,223,0.72)]',
    border: 'border-[rgba(184,92,56,0.22)]',
    selectedBg: 'bg-[var(--real-fire)]',
    text: 'text-[var(--real-fire)]',
  },
  borrowedFire: {
    bg: 'bg-[rgba(246,239,216,0.72)]',
    border: 'border-[rgba(181,139,42,0.22)]',
    selectedBg: 'bg-[var(--borrowed-fire)]',
    text: 'text-[var(--borrowed-fire)]',
  },
  noise: {
    bg: 'bg-[rgba(236,233,228,0.76)]',
    border: 'border-[rgba(120,113,108,0.22)]',
    selectedBg: 'bg-[var(--noise)]',
    text: 'text-[var(--noise)]',
  },
  later: {
    bg: 'bg-[#e8edf5]',
    border: 'border-[rgba(95,114,150,0.22)]',
    selectedBg: 'bg-[#5f7296]',
    text: 'text-[#5f7296]',
  },
}

export const pageShellClass =
  'mx-auto min-h-svh w-full min-w-0 max-w-[1180px] p-4 md:p-6'
export const mainClass = 'flex flex-col gap-6'
export const softNoteClass = 'text-sm text-[var(--text-secondary)]'
export const eyebrowClass =
  'mb-3 text-xs font-[760] uppercase tracking-[0.08em] text-[var(--app-accent)]'
export const primaryButtonClass =
  'h-auto min-h-11 rounded-lg border border-[var(--app-accent)] bg-[var(--app-accent)] px-[15px] py-[11px] font-bold text-white hover:bg-[var(--accent-hover)]'
export const secondaryButtonClass =
  'h-auto min-h-11 rounded-lg border border-[var(--border)] bg-white/80 px-[15px] py-[11px] font-bold text-[var(--text-primary)] hover:bg-white'
export const dangerButtonClass =
  'h-auto min-h-11 rounded-lg border border-[rgba(184,92,56,0.2)] bg-[rgba(247,232,223,0.78)] px-[15px] py-[11px] font-bold text-[var(--real-fire)] hover:border-[rgba(184,92,56,0.34)] hover:bg-[var(--real-fire-bg)]'
export const fieldLabelClass =
  'grid gap-[9px] text-sm font-[750] leading-normal text-[var(--text-primary)]'
export const fieldClass =
  'h-auto min-h-[42px] rounded-none border-0 border-b border-[rgba(107,102,95,0.34)] bg-white/20 px-0.5 py-[10px] text-[var(--text-primary)] shadow-none focus-visible:border-[var(--app-accent)] focus-visible:ring-0'
export const textareaClass = cn(fieldClass, 'min-h-[92px] resize-y')
export const panelClass =
  'rounded-lg border border-[rgba(226,221,212,0.9)] bg-[var(--surface)] shadow-none'
export const codeBlockClass =
  'col-span-full overflow-x-auto rounded-lg bg-[#252525] p-[18px] text-sm leading-[1.55] text-[#fffaf2]'

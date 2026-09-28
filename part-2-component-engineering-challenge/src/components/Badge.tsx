import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20'
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

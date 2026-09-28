import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface TableMessageProps {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'error';
  onRetry?: () => void;
  /** Less padding, for messages inside an opened row. */
  compact?: boolean;
}

/** The one look for empty and error messages, so every state in the dashboard matches. */
export function TableMessage({
  title,
  children,
  tone = 'neutral',
  onRetry,
  compact = false
}: TableMessageProps) {
  const Icon = tone === 'error' ? AlertTriangle : Inbox;

  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={cn('flex flex-col items-center gap-2 text-center', compact ? 'py-4' : 'py-12')}
    >
      <Icon
        aria-hidden="true"
        className={cn('size-6', tone === 'error' ? 'text-rose-500' : 'text-slate-400')}
      />
      <p className="font-medium text-slate-900">{title}</p>
      {children && <p className="text-sm text-slate-500">{children}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          <RotateCw aria-hidden="true" className="size-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}

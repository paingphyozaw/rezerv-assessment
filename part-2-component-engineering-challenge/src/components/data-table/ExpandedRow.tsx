import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

const CLOSE_MS = 200;

/**
 * Keeps the row on screen while it animates closed, then removes it.
 * On open it waits one frame, so the closed size is drawn first and the
 * grow can animate.
 */
function useCollapse(open: boolean) {
  const [mounted, setMounted] = useState(open);

  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);

      const frame = requestAnimationFrame(() => setShown(true));

      return () => cancelAnimationFrame(frame);
    }
    setShown(false);

    const timer = setTimeout(() => setMounted(false), CLOSE_MS);

    return () => clearTimeout(timer);
  }, [open]);

  return { mounted, shown };
}

interface ExpandedRowProps {
  id: string;
  open: boolean;
  columnCount: number;
  viewportWidth: number;
  children: ReactNode;
}

/** The full-width row under a parent row. It grows and shrinks with a CSS grid animation. */
export function ExpandedRow({ id, open, columnCount, viewportWidth, children }: ExpandedRowProps) {
  const { mounted, shown } = useCollapse(open);

  if (!mounted) return null;
  return (
    <tr id={id} aria-hidden={!open} inert={!open}>
      <td colSpan={columnCount} className="border-b border-slate-100 bg-slate-50 p-0">
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
            shown ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="min-h-0 overflow-clip">
            <div className="sticky left-0 px-4 py-3" style={{ width: viewportWidth || undefined }}>
              {children}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

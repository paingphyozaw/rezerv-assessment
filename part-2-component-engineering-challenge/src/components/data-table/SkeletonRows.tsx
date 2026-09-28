import { cn } from '../../lib/cn';
import { bodyCellProps, toggleCellProps, type PinnedLayout } from './tableLayout';
import type { Column } from './types';

const BAR_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6'];

interface SkeletonRowsProps<T> {
  columns: Column<T>[];
  count: number;
  layout: PinnedLayout;
  scrolled: boolean;
  hasToggle: boolean;
}

/** Grey placeholder rows with one bar per column. The cells match the real ones, so nothing jumps when data arrives. */
export function SkeletonRows<T>({
  columns,
  count,
  layout,
  scrolled,
  hasToggle
}: SkeletonRowsProps<T>) {
  return Array.from({ length: count }, (_, rowIndex) => (
    <tr key={rowIndex} data-skeleton-row="" aria-hidden="true">
      {hasToggle && (
        <td {...toggleCellProps(layout)}>
          <div className="mx-auto size-5 rounded bg-slate-200 motion-safe:animate-pulse" />
        </td>
      )}
      {columns.map((column, columnIndex) => (
        <td key={column.key} {...bodyCellProps(column, layout, scrolled)}>
          <div
            className={cn(
              'h-3 rounded bg-slate-200 motion-safe:animate-pulse',
              BAR_WIDTHS[(rowIndex + columnIndex) % BAR_WIDTHS.length],
              column.align === 'right' && 'ml-auto'
            )}
          />
        </td>
      ))}
    </tr>
  ));
}

/** Placeholder lines while an opened row loads its children. */
export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div role="status" className="space-y-2 py-1">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 rounded bg-slate-200 motion-safe:animate-pulse',
            BAR_WIDTHS[i % BAR_WIDTHS.length]
          )}
        />
      ))}
    </div>
  );
}

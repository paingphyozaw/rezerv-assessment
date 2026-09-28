import { ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { cn } from '../../lib/cn';
import { formatDate, formatNumber } from '../../lib/format';
import { ExpandedRow } from './ExpandedRow';
import { SkeletonLines } from './SkeletonRows';
import { TableMessage } from './TableMessage';
import { bodyCellProps, toggleCellProps, type PinnedLayout } from './tableLayout';
import type { Column, Expand, SortValue } from './types';
import type { ChildState } from './useChildRows';

function formatValue(value: SortValue): string {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'number') return formatNumber(value);
  return value;
}

interface TableRowProps<T, C> {
  row: T;
  id: string;
  label: string;
  detailsId: string;
  columns: Column<T>[];
  layout: PinnedLayout;
  scrolled: boolean;
  columnCount: number;
  viewportWidth: number;
  expand: Expand<T, C> | undefined;
  expanded: boolean;
  childState: ChildState<C> | undefined;
  onToggle: (row: T, id: string, isOpen: boolean) => void;
  onRetryChildren: (row: T, id: string) => void;
}

function TableRowBase<T, C>({
  row,
  id,
  label,
  detailsId,
  columns,
  layout,
  scrolled,
  columnCount,
  viewportWidth,
  expand,
  expanded,
  childState,
  onToggle,
  onRetryChildren
}: TableRowProps<T, C>) {
  return (
    <>
      <tr className="group">
        {expand && (
          <td {...toggleCellProps(layout)}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={detailsId}
              aria-label={`${expanded ? 'Hide' : 'Show'} details for ${label}`}
              onClick={() => onToggle(row, id, expanded)}
              className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  'size-4 transition-transform duration-200 motion-reduce:transition-none',
                  expanded && 'rotate-90'
                )}
              />
            </button>
          </td>
        )}
        {columns.map((column) => (
          <td key={column.key} {...bodyCellProps(column, layout, scrolled)}>
            <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {column.cell ? column.cell(row) : formatValue(column.value(row))}
            </div>
          </td>
        ))}
      </tr>
      {expand && (
        <ExpandedRow
          id={detailsId}
          open={expanded}
          columnCount={columnCount}
          viewportWidth={viewportWidth}
        >
          <ChildContent
            row={row}
            id={id}
            expand={expand}
            state={childState}
            onRetry={onRetryChildren}
          />
        </ExpandedRow>
      )}
    </>
  );
}

/** Only re-renders when its own props change, so opening one row leaves the others alone. */
export const TableRow = memo(TableRowBase) as typeof TableRowBase;

interface ChildContentProps<T, C> {
  row: T;
  id: string;
  expand: Expand<T, C>;
  state: ChildState<C> | undefined;
  onRetry: (row: T, id: string) => void;
}

function ChildContent<T, C>({ row, id, expand, state, onRetry }: ChildContentProps<T, C>) {
  if (expand.mode === 'render') return expand.renderContent(row);

  const empty = <TableMessage compact title={expand.emptyText ?? 'Nothing to show'} />;

  if (expand.mode === 'inline') {
    const children = expand.getChildren(row);

    return children.length > 0 ? expand.renderChildren(children, row) : empty;
  }
  if (!state || state.status === 'loading') return <SkeletonLines />;
  if (state.status === 'error')
    return (
      <TableMessage
        compact
        tone="error"
        title="Could not load these rows"
        onRetry={() => onRetry(row, id)}
      />
    );
  return state.children.length > 0 ? expand.renderChildren(state.children, row) : empty;
}

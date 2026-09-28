import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/format';
import { Pagination } from './Pagination';
import { SkeletonRows } from './SkeletonRows';
import { TableMessage } from './TableMessage';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { usePinnedLayout } from './tableLayout';
import type { DataTableProps } from './types';
import { useChildRows } from './useChildRows';
import { useDataTable } from './useDataTable';
import { useTableViewport } from './useTableViewport';

/** A short fade on the rows after the sort changes. Returns the ref for the <tbody>. */
function useSortFade(sortKey: string) {
  const ref = useRef<HTMLTableSectionElement>(null);

  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.animate?.([{ opacity: 0.4 }, { opacity: 1 }], {
      duration: 150,
      easing: 'ease-out'
    });
  }, [sortKey]);
  return ref;
}

/**
 * A reusable table: pass rows and column definitions. It handles sorting,
 * paging, open rows (inline or loaded on demand), a pinned left column, and
 * loading, empty and error states. See types.ts for every prop.
 */
export function DataTable<T, C = never>(props: DataTableProps<T, C>) {
  const {
    columns,
    getRowId,
    getRowLabel = getRowId,
    caption,
    mode = 'client',
    status = 'ready',
    onRetry,
    emptyText = 'No results',
    expand,
    paginate = true
  } = props;

  const table = useDataTable(props);

  const hasToggle = Boolean(expand);

  const layout = usePinnedLayout(columns, hasToggle);

  const { states: childStates, load, loadIfNeeded, cancel } = useChildRows(expand);

  const viewport = useTableViewport();

  const tableId = useId();

  const bodyRef = useSortFade(table.sort ? `${table.sort.key}:${table.sort.direction}` : '');

  const { toggleExpanded } = table;

  const onToggle = useCallback(
    (row: T, id: string, isOpen: boolean) => {
      if (isOpen) cancel(id);
      else loadIfNeeded(row, id);
      toggleExpanded(id);
    },
    [cancel, loadIfNeeded, toggleExpanded]
  );

  const columnCount = columns.length + (hasToggle ? 1 : 0);

  // In server mode the old page stays on screen (dimmed) while the next one loads.
  const showSkeleton = status === 'loading' && !(mode === 'server' && table.rows.length > 0);

  const refreshing = status === 'loading' && !showSkeleton;

  const messageRow = (content: ReactNode) => (
    <tr>
      <td colSpan={columnCount}>{content}</td>
    </tr>
  );

  let body: ReactNode;

  if (status === 'error') {
    body = messageRow(
      <TableMessage tone="error" title="Could not load data" onRetry={onRetry}>
        Something went wrong. Please try again.
      </TableMessage>
    );
  } else if (showSkeleton) {
    body = (
      <SkeletonRows
        columns={columns}
        count={paginate ? table.pageSize : 5}
        layout={layout}
        scrolled={viewport.scrolled}
        hasToggle={hasToggle}
      />
    );
  } else if (table.rows.length === 0) {
    body = messageRow(<TableMessage title={emptyText} />);
  } else {
    body = table.rows.map((row) => {
      const id = getRowId(row);

      return (
        <TableRow<T, C>
          key={id}
          row={row}
          id={id}
          label={getRowLabel(row)}
          detailsId={`${tableId}-${id}-details`}
          columns={columns}
          layout={layout}
          scrolled={viewport.scrolled}
          columnCount={columnCount}
          viewportWidth={viewport.width}
          expand={expand}
          expanded={table.isExpanded(id)}
          childState={childStates.get(id)}
          onToggle={onToggle}
          onRetryChildren={load}
        />
      );
    });
  }

  const first = table.total === 0 ? 0 : table.pageIndex * table.pageSize + 1;

  const last = paginate
    ? Math.min(table.total, (table.pageIndex + 1) * table.pageSize)
    : table.total;

  const announcement =
    status === 'loading'
      ? 'Loading'
      : status === 'error'
        ? 'Could not load data'
        : `Showing ${first}–${last} of ${formatNumber(table.total)}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div
        ref={viewport.ref}
        role="region"
        aria-label={`Scrollable table: ${caption}`}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-indigo-500"
        onScroll={viewport.onScroll}
      >
        <table
          className="w-full min-w-max border-separate border-spacing-0 text-left text-sm"
          aria-busy={status === 'loading'}
        >
          <caption className="sr-only">{caption}</caption>
          <TableHeader
            columns={columns}
            layout={layout}
            scrolled={viewport.scrolled}
            hasToggle={hasToggle}
            sort={table.sort}
            onSort={table.toggleSort}
          />
          <tbody ref={bodyRef} className={cn('transition-opacity', refreshing && 'opacity-60')}>
            {body}
          </tbody>
        </table>
      </div>
      {paginate && status !== 'error' && !showSkeleton && (
        <Pagination
          pageIndex={table.pageIndex}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          pageSizes={table.pageSizes}
          total={table.total}
          onPageIndexChange={table.setPageIndex}
          onPageSizeChange={table.setPageSize}
        />
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

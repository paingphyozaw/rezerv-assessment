import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import {
  columnStyle,
  HEADER_BASE,
  HEADER_CELL,
  SHADOW,
  TOGGLE_STYLE,
  type PinnedLayout
} from './tableLayout';
import type { Column, SortState } from './types';

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

const SORT_ICONS = { asc: ChevronUp, desc: ChevronDown };

interface TableHeaderProps<T> {
  columns: Column<T>[];
  layout: PinnedLayout;
  scrolled: boolean;
  hasToggle: boolean;
  sort: SortState;
  onSort: (key: string) => void;
}

/** The header row: an empty cell above the expand buttons, then one cell per column. */
export function TableHeader<T>({
  columns,
  layout,
  scrolled,
  hasToggle,
  sort,
  onSort
}: TableHeaderProps<T>) {
  return (
    <thead>
      <tr>
        {hasToggle && (
          <th
            scope="col"
            style={TOGGLE_STYLE}
            className={cn(HEADER_BASE, 'px-2', layout.anyPinned && 'sticky z-20')}
          >
            <span className="sr-only">Details</span>
          </th>
        )}
        {columns.map((column) => (
          <HeaderCell
            key={column.key}
            column={column}
            sort={sort}
            onSort={onSort}
            left={layout.left.get(column.key)}
            showShadow={column.key === layout.lastPinned && scrolled}
          />
        ))}
      </tr>
    </thead>
  );
}

interface HeaderCellProps<T> {
  column: Column<T>;
  sort: SortState;
  onSort: (key: string) => void;
  left: number | string | undefined;
  showShadow: boolean;
}

function HeaderCell<T>({ column, sort, onSort, left, showShadow }: HeaderCellProps<T>) {
  const direction = sort?.key === column.key ? sort.direction : null;

  const ariaSort = direction ? ARIA_SORT[direction] : 'none';

  const Icon = direction ? SORT_ICONS[direction] : ChevronsUpDown;

  return (
    <th
      scope="col"
      aria-sort={column.sortable ? ariaSort : undefined}
      style={columnStyle(column, left)}
      className={cn(HEADER_CELL, column.pinned && 'sticky z-20', showShadow && SHADOW)}
    >
      {column.sortable ? (
        <button
          type="button"
          onClick={() => onSort(column.key)}
          className={cn(
            'group/sort -mx-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500',
            column.align === 'right' && 'flex-row-reverse'
          )}
        >
          {column.header}
          <Icon
            aria-hidden="true"
            className={cn(
              'size-3.5',
              direction ? 'text-indigo-600' : 'text-slate-400 group-hover/sort:text-slate-600'
            )}
          />
        </button>
      ) : (
        column.header
      )}
    </th>
  );
}

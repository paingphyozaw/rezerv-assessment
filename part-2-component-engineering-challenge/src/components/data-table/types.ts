import type { ReactNode } from 'react';

export type SortValue = string | number | Date | null | undefined;
export type SortDirection = 'asc' | 'desc';
export type SortState = { key: string; direction: SortDirection } | null;
export type DataMode = 'client' | 'server';

/** pageIndex starts at 0. */
export interface PageState {
  pageIndex: number;
  pageSize: number;
}

export type TableStatus = 'loading' | 'error' | 'ready';

interface ColumnDefinition<T> {
  /** Unique column id, including computed columns such as attendance. */
  key: string;
  header: string;
  /** Typed accessor used for sorting and default cell text. */
  value: (row: T) => SortValue;
  /** Custom cell content. Defaults to the formatted value. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right';
}

/** Pinned columns require an explicit width for their sticky offsets. */
export type Column<T> = ColumnDefinition<T> &
  ({ pinned: true; width: number } | { pinned?: false; width?: number });

interface ExpandBase<T, C> {
  renderChildren: (children: C[], row: T) => ReactNode;
  emptyText?: string;
}

/** Child rows that come with the parent row. */
export interface InlineExpand<T, C> extends ExpandBase<T, C> {
  mode: 'inline';
  getChildren: (row: T) => C[];
}

/** Child rows loaded the first time the row is opened. */
export interface LazyExpand<T, C> extends ExpandBase<T, C> {
  mode: 'lazy';
  loadChildren: (row: T, signal: AbortSignal) => Promise<C[]>;
}

/** For details components that own their requests, pagination, and loading UI. */
export interface RenderExpand<T> {
  mode: 'render';
  renderContent: (row: T) => ReactNode;
}

export type Expand<T, C> = InlineExpand<T, C> | LazyExpand<T, C> | RenderExpand<T>;

/** Shared input for the headless hook and the rendered table. */
export interface TableStateOptions<T> {
  rows: T[];
  columns: Column<T>[];
  /** Client mode sorts/pages locally; server mode emits changes to the caller. */
  mode?: DataMode;
  /** Required at runtime for server pagination, even when the total is zero. */
  totalRows?: number;
  /** Loading/error states preserve the requested page until the count is known. */
  status?: TableStatus;
  /** Pass state to control it; otherwise the table owns it. */
  sort?: SortState;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  page?: PageState;
  defaultPage?: PageState;
  onPageChange?: (page: PageState) => void;
  pageSizes?: number[];
  paginate?: boolean;
}

export interface DataTableProps<T, C = never> extends TableStateOptions<T> {
  getRowId: (row: T) => string;
  /** Used in accessible expand-button labels. Defaults to the row id. */
  getRowLabel?: (row: T) => string;
  caption: string;
  onRetry?: () => void;
  emptyText?: string;
  expand?: Expand<T, C>;
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  changePageSize,
  clampPageIndex,
  cleanPage,
  cleanPageSizes,
  pageCount,
  pageRows
} from './paging';
import { findSortColumn, nextSort, sortRows } from './sorting';
import type { PageState, SortState, TableStateOptions } from './types';

/** Warns in development when a prop switches between controlled and uncontrolled. */
function useControlledWarning(name: string, isControlled: boolean) {
  const first = useRef(isControlled);

  useEffect(() => {
    if (import.meta.env.DEV && first.current !== isControlled)
      console.warn(`DataTable: "${name}" switched between controlled and uncontrolled. Pick one.`);
  }, [name, isControlled]);
}

/**
 * All the table logic, without any HTML: sorting, paging and open rows.
 * `sort` and `page` work like React inputs: pass them to control them from the
 * parent, or leave them out and the hook keeps them. The on…Change callbacks
 * are called either way.
 */
export function useDataTable<T>(options: TableStateOptions<T>) {
  const {
    rows,
    columns,
    mode = 'client',
    totalRows,
    status = 'ready',
    sort: controlledSort,
    defaultSort = null,
    onSortChange,
    page: controlledPage,
    defaultPage,
    onPageChange,
    pageSizes,
    paginate = true
  } = options;

  useEffect(() => {
    if (!import.meta.env.DEV || mode !== 'server') return;
    if (paginate && totalRows === undefined) {
      console.warn('DataTable: server pagination needs totalRows from the response.');
    }
    if (paginate && !onPageChange) {
      console.warn('DataTable: server pagination needs onPageChange to request another page.');
    }
    if (columns.some((column) => column.sortable) && !onSortChange) {
      console.warn('DataTable: server sorting needs onSortChange to request sorted rows.');
    }
  }, [mode, paginate, totalRows, onPageChange, onSortChange, columns]);

  const validPageSizes = useMemo(() => cleanPageSizes(pageSizes), [pageSizes]);

  const [localSort, setLocalSort] = useState<SortState>(defaultSort);

  const [localPage, setLocalPage] = useState<PageState>(
    () => defaultPage ?? { pageIndex: 0, pageSize: validPageSizes[0] }
  );

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());

  const sortIsControlled = controlledSort !== undefined;

  const pageIsControlled = controlledPage !== undefined;

  useControlledWarning('sort', sortIsControlled);
  useControlledWarning('page', pageIsControlled);

  const requestedSort = sortIsControlled ? controlledSort : localSort;

  const requestedPage = pageIsControlled ? controlledPage : localPage;

  const page = cleanPage(requestedPage, validPageSizes[0]);

  const displayedPageSizes = useMemo(
    () =>
      validPageSizes.includes(page.pageSize)
        ? validPageSizes
        : [...validPageSizes, page.pageSize].sort((a, b) => a - b),
    [validPageSizes, page.pageSize]
  );

  // A key that is unknown or not sortable means "not sorted".
  const sortColumn = findSortColumn(columns, requestedSort);

  const sort = sortColumn ? requestedSort : null;

  const badSortKey = requestedSort && !sortColumn ? requestedSort.key : null;

  useEffect(() => {
    if (badSortKey && import.meta.env.DEV)
      console.warn(`DataTable: cannot sort by "${badSortKey}". No sortable column has that key.`);
  }, [badSortKey]);

  // The latest callbacks, kept in a ref. Parents often pass a new inline arrow
  // on every render; without this, the effects below would re-run each time.
  const callbacks = useRef({ onSortChange, onPageChange });

  useLayoutEffect(() => {
    callbacks.current = { onSortChange, onPageChange };
  });

  const setPage = useCallback(
    (next: PageState) => {
      if (!pageIsControlled) setLocalPage(next);
      callbacks.current.onPageChange?.(next);
    },
    [pageIsControlled]
  );

  const setSort = useCallback(
    (next: SortState) => {
      if (!sortIsControlled) setLocalSort(next);
      callbacks.current.onSortChange?.(next);
      setPage({ pageIndex: 0, pageSize: page.pageSize });
    },
    [sortIsControlled, setPage, page.pageSize]
  );

  const sortedRows = useMemo(
    () => (mode === 'client' ? sortRows(rows, columns, sort) : rows),
    [mode, rows, columns, sort]
  );

  const total = mode === 'server' ? (totalRows ?? rows.length) : rows.length;

  // While loading or after an error the row count is not known, so keep the page that was asked for.
  let pageIndex = paginate ? page.pageIndex : 0;

  if (paginate && status === 'ready')
    pageIndex = clampPageIndex(page.pageIndex, total, page.pageSize);

  // Keep the page in range when the data shrinks or a bad page comes in.
  useEffect(() => {
    if (
      paginate &&
      (pageIndex !== requestedPage.pageIndex || page.pageSize !== requestedPage.pageSize)
    ) {
      setPage({ pageIndex, pageSize: page.pageSize });
    }
  }, [
    paginate,
    pageIndex,
    requestedPage.pageIndex,
    requestedPage.pageSize,
    page.pageSize,
    setPage
  ]);

  const visibleRows = useMemo(
    () =>
      mode === 'client' && paginate
        ? pageRows(sortedRows, { pageIndex, pageSize: page.pageSize })
        : sortedRows,
    [mode, paginate, sortedRows, pageIndex, page.pageSize]
  );

  const toggleSort = useCallback((key: string) => setSort(nextSort(sort, key)), [setSort, sort]);

  const setPageIndex = useCallback(
    (index: number) => setPage({ pageIndex: index, pageSize: page.pageSize }),
    [setPage, page.pageSize]
  );

  const setPageSize = useCallback(
    (size: number) => setPage(changePageSize({ pageIndex, pageSize: page.pageSize }, size)),
    [setPage, pageIndex, page.pageSize]
  );

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    rows: visibleRows,
    sort,
    pageIndex,
    pageSize: page.pageSize,
    pageSizes: displayedPageSizes,
    total,
    pageCount: pageCount(total, page.pageSize),
    toggleSort,
    setPageIndex,
    setPageSize,
    isExpanded,
    toggleExpanded
  };
}

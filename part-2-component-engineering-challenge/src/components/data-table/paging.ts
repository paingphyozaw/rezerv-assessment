import type { PageState } from './types';

const DEFAULT_PAGE_SIZES = [10, 25, 50];

const isPageSize = (size: number) => Number.isFinite(size) && size >= 1;

/** Whole page sizes of 1 or more, without repeats. Falls back to 10, 25 and 50 when none are left. */
export function cleanPageSizes(sizes: number[] = DEFAULT_PAGE_SIZES): number[] {
  const clean = [...new Set(sizes.filter(isPageSize).map(Math.floor))];

  return clean.length ? clean : DEFAULT_PAGE_SIZES;
}

/** Makes a page from outside safe to use: NaN, negative and fractional numbers are fixed. */
export function cleanPage({ pageIndex, pageSize }: PageState, fallbackSize: number): PageState {
  return {
    pageIndex: Number.isFinite(pageIndex) ? Math.max(0, Math.floor(pageIndex)) : 0,
    pageSize: isPageSize(pageSize) ? Math.floor(pageSize) : fallbackSize
  };
}

export const pageCount = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));

/** Moves a page number into the valid range: a page past the end becomes the last page. */
export function clampPageIndex(pageIndex: number, total: number, pageSize: number): number {
  const last = pageCount(total, pageSize) - 1;

  return Math.min(Math.max(0, Math.floor(pageIndex)), last);
}

export function pageRows<T>(rows: T[], { pageIndex, pageSize }: PageState): T[] {
  const start = pageIndex * pageSize;

  return rows.slice(start, start + pageSize);
}

/** A new page size keeps the first row of the current page on screen. */
export function changePageSize(page: PageState, pageSize: number): PageState {
  const firstRow = page.pageIndex * page.pageSize;

  return { pageIndex: Math.floor(firstRow / pageSize), pageSize };
}

/** Page buttons to show, with 'gap' for hidden pages: 1 … 10 11 12 … 20 */
export function pageButtons(pageIndex: number, count: number): (number | 'gap')[] {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i);

  let start = Math.max(1, Math.min(pageIndex - 1, count - 4));

  let end = Math.min(count - 2, Math.max(pageIndex + 1, 3));

  // A gap that would hide just one page shows that page instead.
  if (start === 2) start = 1;
  if (end === count - 3) end = count - 2;

  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return [
    0,
    ...(start > 1 ? (['gap'] as const) : []),
    ...middle,
    ...(end < count - 2 ? (['gap'] as const) : []),
    count - 1
  ];
}

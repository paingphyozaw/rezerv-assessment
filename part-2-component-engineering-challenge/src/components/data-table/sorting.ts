import type { Column, SortDirection, SortState, SortValue } from './types';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const isEmpty = (value: SortValue): value is null | undefined =>
  value === null || value === undefined;

/** Compares two values for an ascending sort: numbers and dates by size, text in natural order. */
function compareValues(a: string | number | Date, b: string | number | Date): number {
  if (typeof a === 'string' && typeof b === 'string') return collator.compare(a, b);

  const x = a instanceof Date ? a.getTime() : a;

  const y = b instanceof Date ? b.getTime() : b;

  if (typeof x === 'number' && typeof y === 'number') return x - y;
  return collator.compare(String(a), String(b));
}

/** The column a sort points at, or null when there is no sort or that column cannot be sorted. */
export function findSortColumn<T>(columns: Column<T>[], sort: SortState): Column<T> | null {
  if (!sort) return null;
  return columns.find((column) => column.key === sort.key && column.sortable) ?? null;
}

/** Sorts a copy of the rows. Ties keep their order, and empty values are always last. */
export function sortByValue<T>(
  rows: T[],
  getValue: (row: T) => SortValue,
  direction: SortDirection
): T[] {
  const sign = direction === 'asc' ? 1 : -1;

  return rows
    .map((row, index) => ({ row, index, value: getValue(row) }))
    .sort((a, b) => {
      if (isEmpty(a.value) || isEmpty(b.value)) {
        if (isEmpty(a.value) && isEmpty(b.value)) return a.index - b.index;
        return isEmpty(a.value) ? 1 : -1;
      }
      return compareValues(a.value, b.value) * sign || a.index - b.index;
    })
    .map((item) => item.row);
}

/** Sorts rows by one of the columns. Returns the same array when there is nothing to sort by. */
export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState): T[] {
  const column = findSortColumn(columns, sort);

  if (!sort || !column) return rows;
  return sortByValue(rows, column.value, sort.direction);
}

/** Header click: not sorted → ascending → descending → not sorted. A new column starts at ascending. */
export function nextSort(current: SortState, key: string): SortState {
  if (current?.key !== key) return { key, direction: 'asc' };
  return current.direction === 'asc' ? { key, direction: 'desc' } : null;
}

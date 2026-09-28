import { describe, expect, it } from 'vitest';
import { sortByValue, sortRows } from '../src/components/data-table/sorting';
import {
  changePageSize,
  clampPageIndex,
  cleanPage,
  cleanPageSizes,
  pageButtons,
  pageCount
} from '../src/components/data-table/paging';
import type { Column } from '../src/components/data-table/types';

interface Row {
  id: string;
  name: string | null;
  count: number | null;
  date: Date | null;
}

const rows: Row[] = [
  { id: 'a', name: 'Class 10', count: 3, date: new Date('2026-01-03') },
  { id: 'b', name: 'class 2', count: null, date: new Date('2026-01-01') },
  { id: 'c', name: null, count: 1, date: null },
  { id: 'd', name: 'Class 1', count: 3, date: new Date('2026-01-02') }
];

const columns: Column<Row>[] = [
  { key: 'name', value: (row) => row.name, header: 'Name', sortable: true },
  { key: 'count', value: (row) => row.count, header: 'Count', sortable: true },
  { key: 'date', value: (row) => row.date, header: 'Date', sortable: true },
  { key: 'locked', header: 'Locked', value: (row) => row.id }
];

const ids = (list: Row[]) => list.map((row) => row.id).join('');

describe('sortRows', () => {
  it('sorts text in natural order and ignores case, with empty values last', () => {
    expect(ids(sortRows(rows, columns, { key: 'name', direction: 'asc' }))).toBe('dbac');
    expect(ids(sortRows(rows, columns, { key: 'name', direction: 'desc' }))).toBe('abdc');
  });

  it('sorts numbers, keeps ties in their order, and puts empty values last both ways', () => {
    expect(ids(sortRows(rows, columns, { key: 'count', direction: 'asc' }))).toBe('cadb');
    expect(ids(sortRows(rows, columns, { key: 'count', direction: 'desc' }))).toBe('adcb');
    expect(ids(rows)).toBe('abcd'); // Sorting must not mutate the supplied dataset.
  });

  it('sorts dates', () => {
    expect(ids(sortRows(rows, columns, { key: 'date', direction: 'asc' }))).toBe('bdac');
  });

  it('leaves the order alone with no sort, an unknown key, or an unsortable column', () => {
    expect(sortRows(rows, columns, null)).toBe(rows);
    expect(ids(sortRows(rows, columns, { key: 'missing', direction: 'asc' }))).toBe('abcd');
    expect(ids(sortRows(rows, columns, { key: 'locked', direction: 'asc' }))).toBe('abcd');
  });

  it('sorts a large dataset correctly without changing the source', () => {
    const many = Array.from({ length: 5000 }, (_, i) => ({ count: 4999 - i }));

    const sorted = sortByValue(many, (row) => row.count, 'asc');

    expect(sorted.map((row) => row.count)).toEqual(Array.from({ length: 5000 }, (_, i) => i));
    expect(many[0].count).toBe(4999);
  });
});

describe('pagination edge cases', () => {
  it('normalizes invalid inputs and keeps an empty dataset on page one', () => {
    expect(cleanPage({ pageIndex: NaN, pageSize: 0 }, 10)).toEqual({ pageIndex: 0, pageSize: 10 });
    expect(cleanPageSizes([0, -2, NaN, Infinity])).toEqual([10, 25, 50]);
    expect(cleanPageSizes([5, 5, 10.8])).toEqual([5, 10]);
    expect(pageCount(0, 10)).toBe(1);
    expect(clampPageIndex(3, 0, 10)).toBe(0);
  });

  it('bounds page indexes and keeps the first visible row after a page-size change', () => {
    expect(clampPageIndex(9, 41, 10)).toBe(4);
    expect(clampPageIndex(-2, 41, 10)).toBe(0);
    expect(changePageSize({ pageIndex: 5, pageSize: 10 }, 25)).toEqual({
      pageIndex: 2,
      pageSize: 25
    });
  });

  it('keeps the first, current, and last pages visible without hiding a single page', () => {
    expect(pageButtons(2, 4)).toEqual([0, 1, 2, 3]);
    expect(pageButtons(0, 20)).toEqual([0, 1, 2, 3, 'gap', 19]);
    expect(pageButtons(10, 20)).toEqual([0, 'gap', 9, 10, 11, 'gap', 19]);
    expect(pageButtons(19, 20)).toEqual([0, 'gap', 16, 17, 18, 19]);
    expect(pageButtons(3, 20)).toEqual([0, 1, 2, 3, 4, 'gap', 19]);
  });
});

import { pageRows } from '../components/data-table/paging';
import { sortByValue } from '../components/data-table/sorting';
import type { PageState, SortState, SortValue } from '../components/data-table/types';

export interface DemoSettings {
  failNextRequest: boolean;
  emptyData: boolean;
}

let settings: DemoSettings = { failNextRequest: false, emptyData: false };

const listeners = new Set<() => void>();

/** The switches in the demo panel. React reads them with useSyncExternalStore. */
export const demoSettings = {
  get: (): DemoSettings => settings,
  set: (patch: Partial<DemoSettings>) => {
    settings = { ...settings, ...patch };
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

export class ApiError extends Error {
  override name = 'ApiError';
}

const abortError = () => new DOMException('The request was stopped.', 'AbortError');

/**
 * Pretends to call a server with a short fixed delay, fails once with
 * "Fail next request", and stops early when `signal` aborts.
 * `work` gets `true` when "Empty data" is on.
 */
export function request<T>(work: (empty: boolean) => T, signal?: AbortSignal): Promise<T> {
  const { failNextRequest, emptyData } = settings;

  if (failNextRequest) demoSettings.set({ failNextRequest: false });

  const wait = 400 + Math.random() * 500;

  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (failNextRequest) {
        reject(new ApiError('The server did not answer. Please try again.'));
        return;
      }
      try {
        resolve(work(emptyData));
      } catch (error) {
        reject(error);
      }
    }, wait);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** What a list endpoint receives: `?sort=…&page=…&size=…`. */
export interface PageQuery {
  sort: SortState;
  page: PageState;
}

/** One page of rows, and the count of all matching rows. */
export interface PageResult<T> {
  items: T[];
  total: number;
}

/** The fields an endpoint can sort by. Any other sort key keeps the original order. */
export type SortValues<T> = Record<string, (row: T) => SortValue>;

/**
 * What every mock list endpoint does: sort all rows, then return one page and the full count.
 * `Object.hasOwn` stops keys such as "__proto__" or "toString" from matching.
 */
export function sortAndPage<T>(
  rows: T[],
  sortValues: SortValues<T>,
  { sort, page }: PageQuery
): PageResult<T> {
  const sorted =
    sort && Object.hasOwn(sortValues, sort.key)
      ? sortByValue(rows, sortValues[sort.key], sort.direction)
      : rows;

  return { items: pageRows(sorted, page), total: rows.length };
}

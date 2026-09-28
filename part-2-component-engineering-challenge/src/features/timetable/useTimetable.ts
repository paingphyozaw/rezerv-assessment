import { useCallback, useMemo } from 'react';
import {
  getClassesWithAttendees,
  getClassesWithAttendeesPage,
  getClassSessions,
  getClassSessionsPage,
  type AttendeeMode,
  type ClassPage,
  type TimetableRow
} from './api';
import type { DataMode, PageState, SortState } from '../../components/data-table';
import { filterClassesByDay, summarizeClasses, type DayFilter } from './schedule';
import { useAsync } from '../../hooks/useAsync';

interface TimetableQuery {
  attendeeMode: AttendeeMode;
  processingMode: DataMode;
  day: DayFilter;
  sort: SortState;
  page: PageState;
}

/** Fetches full client data or one server page, then exposes one shape to the view. */
export function useTimetable({ attendeeMode, processingMode, day, sort, page }: TimetableQuery) {
  // Client mode loads the whole week once. Day, sort and page are then applied in the browser.
  const loadWeek = useCallback(
    async (signal: AbortSignal): Promise<ClassPage<TimetableRow>> => {
      const items = await (attendeeMode === 'inline'
        ? getClassesWithAttendees(signal)
        : getClassSessions(signal));

      return { items, total: items.length, stats: summarizeClasses(items) };
    },
    [attendeeMode]
  );

  // Server mode asks for one filtered, sorted page each time the day, sort or page changes.
  const loadPage = useCallback(
    (signal: AbortSignal): Promise<ClassPage<TimetableRow>> => {
      const query = { day, sort, page };

      return attendeeMode === 'inline'
        ? getClassesWithAttendeesPage(query, signal)
        : getClassSessionsPage(query, signal);
    },
    [attendeeMode, day, sort, page]
  );

  const result = useAsync(processingMode === 'server' ? loadPage : loadWeek);

  const rows = useMemo(() => {
    const items = result.data?.items ?? [];

    return processingMode === 'client' ? filterClassesByDay(items, day) : items;
  }, [result.data, processingMode, day]);

  const stats =
    processingMode === 'server' && result.data ? result.data.stats : summarizeClasses(rows);

  return { rows, stats, status: result.status, retry: result.retry };
}

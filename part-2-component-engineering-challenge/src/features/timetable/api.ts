import { classes, type Attendee, type ClassSession, type ClassWithAttendees } from './data';
import {
  attendanceRatio,
  filterClassesByDay,
  minutesIntoWeek,
  summarizeClasses,
  type DayFilter,
  type ScheduleStats
} from './schedule';
import {
  request,
  sortAndPage,
  type PageQuery,
  type PageResult,
  type SortValues
} from '../../lib/mockApi';

export interface ClassPage<T> extends PageResult<T> {
  stats: ScheduleStats;
}

/** 'inline': attendees come with each class. 'lazy': they are fetched when a class opens. */
export type AttendeeMode = 'inline' | 'lazy';

/** A class from either list endpoint. `attendees` is there only when they were included. */
export type TimetableRow = ClassSession & { attendees?: Attendee[] };

interface ClassPageQuery extends PageQuery {
  day: DayFilter;
}

const CLASS_SORT_VALUES: SortValues<ClassSession> = {
  name: (row) => row.name,
  instructor: (row) => row.instructor,
  day: (row) => row.day,
  time: minutesIntoWeek,
  attendance: attendanceRatio,
  status: (row) => row.status
};

const ATTENDEE_SORT_VALUES: SortValues<Attendee> = {
  name: (row) => row.name,
  paymentType: (row) => row.paymentType,
  bookingStatus: (row) => row.bookingStatus
};

/** The class without its attendee list, as the list endpoints return it. */
const withoutAttendees = ({ attendees: _, ...session }: ClassWithAttendees): ClassSession =>
  session;

const attendeesOf = (classId: string): Attendee[] =>
  classes.find((session) => session.id === classId)?.attendees ?? [];

/** Pure query step shared by the two class endpoints. */
function queryClasses(query: ClassPageQuery, empty: boolean): ClassPage<ClassWithAttendees> {
  const matching = filterClassesByDay(empty ? [] : classes, query.day);

  return { ...sortAndPage(matching, CLASS_SORT_VALUES, query), stats: summarizeClasses(matching) };
}

/** Mock server endpoint for sorted and paged timetable rows with attendees included. */
export const getClassesWithAttendeesPage = (
  query: ClassPageQuery,
  signal?: AbortSignal
): Promise<ClassPage<ClassWithAttendees>> => request((empty) => queryClasses(query, empty), signal);

/** Mock server endpoint for sorted and paged timetable rows without attendee payloads. */
export const getClassSessionsPage = (
  query: ClassPageQuery,
  signal?: AbortSignal
): Promise<ClassPage<ClassSession>> =>
  request((empty) => {
    const result = queryClasses(query, empty);

    return { ...result, items: result.items.map(withoutAttendees) };
  }, signal);

/** GET /classes?include=attendees — every class with its attendees. */
export const getClassesWithAttendees = (signal?: AbortSignal): Promise<ClassWithAttendees[]> =>
  request((empty) => (empty ? [] : classes), signal);

/** GET /classes — every class, without attendees. */
export const getClassSessions = (signal?: AbortSignal): Promise<ClassSession[]> =>
  request((empty) => (empty ? [] : classes.map(withoutAttendees)), signal);

/** GET /classes/:id/attendees */
export const getAttendees = (classId: string, signal?: AbortSignal): Promise<Attendee[]> =>
  request((empty) => (empty ? [] : attendeesOf(classId)), signal);

/** Mock server endpoint for a class's sorted and paged attendees. */
export function getAttendeesPage(
  classId: string,
  query: PageQuery,
  signal?: AbortSignal
): Promise<PageResult<Attendee>> {
  return request(
    (empty) => sortAndPage(empty ? [] : attendeesOf(classId), ATTENDEE_SORT_VALUES, query),
    signal
  );
}

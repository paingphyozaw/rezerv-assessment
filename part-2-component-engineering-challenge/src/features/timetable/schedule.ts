import type { ClassSession } from './data';
import { formatTime } from '../../lib/format';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type DayFilter = number | 'all';

export const classLabel = (session: ClassSession) =>
  `${session.name}, ${DAYS[session.day]} ${formatTime(session.startMinutes)}`;

/** Minutes since Monday 00:00, so classes sort by day and then by start time. */
export const minutesIntoWeek = (session: ClassSession) =>
  session.day * 24 * 60 + session.startMinutes;

/** Booked places as a share of capacity. A class with no places counts as 0. */
export const attendanceRatio = (session: ClassSession) =>
  session.capacity ? session.booked / session.capacity : 0;

export function filterClassesByDay<T extends ClassSession>(rows: T[], day: DayFilter): T[] {
  return day === 'all' ? rows : rows.filter((row) => row.day === day);
}

export interface ScheduleStats {
  total: number;
  booked: number;
  full: number;
  cancelled: number;
}

export function summarizeClasses(rows: ClassSession[]): ScheduleStats {
  return {
    total: rows.length,
    booked: rows.reduce((total, row) => total + row.booked, 0),
    full: rows.filter((row) => row.status === 'Full').length,
    cancelled: rows.filter((row) => row.status === 'Cancelled').length
  };
}

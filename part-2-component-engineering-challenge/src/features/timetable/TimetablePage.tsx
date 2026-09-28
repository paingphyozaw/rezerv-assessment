import { useMemo, useState } from 'react';
import type { AttendeeMode } from './api';
import { Badge, type BadgeTone } from '../../components/Badge';
import {
  DataTable,
  type Column,
  type DataMode,
  type PageState,
  type SortState
} from '../../components/data-table';
import { DemoControls } from '../../components/DemoControls';
import { PageLayout } from '../../components/PageLayout';
import type { ClassSession, ClassStatus } from './data';
import { attendanceRatio, classLabel, DAYS, minutesIntoWeek, type DayFilter } from './schedule';
import { formatTime } from '../../lib/format';
import { createAttendeeExpansion } from './AttendeeTable';
import { ScheduleToolbar } from './ScheduleToolbar';
import { useTimetable } from './useTimetable';

const CLASS_TONES: Record<ClassStatus, BadgeTone> = {
  Scheduled: 'blue',
  Full: 'amber',
  Cancelled: 'gray'
};

function Attendance({ session }: { session: ClassSession }) {
  const ratio = attendanceRatio(session);

  return (
    <div className="flex items-center gap-2">
      <span className="w-12 tabular-nums">
        {session.booked} / {session.capacity}
      </span>
      <span aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <span
          className={ratio >= 1 ? 'block h-full bg-amber-500' : 'block h-full bg-indigo-500'}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </div>
  );
}

// Defined once, outside the component, so the table's memoization keeps working.
// The same columns serve both modes: a ClassWithAttendees is also a ClassSession.
const classColumns: Column<ClassSession>[] = [
  {
    key: 'name',
    header: 'Class',
    value: (c) => c.name,
    cell: (c) => <span className="font-medium text-slate-900">{c.name}</span>,
    sortable: true,
    width: 200,
    pinned: true
  },
  {
    key: 'instructor',
    header: 'Instructor',
    value: (c) => c.instructor,
    sortable: true,
    width: 160
  },
  {
    key: 'day',
    header: 'Day',
    value: (c) => c.day,
    cell: (c) => DAYS[c.day],
    sortable: true,
    width: 90
  },
  {
    key: 'time',
    header: 'Time',
    value: minutesIntoWeek,
    cell: (c) =>
      `${formatTime(c.startMinutes)} – ${formatTime(c.startMinutes + c.durationMinutes)}`,
    sortable: true,
    width: 190
  },
  {
    key: 'attendance',
    header: 'Attendance',
    value: attendanceRatio,
    cell: (c) => <Attendance session={c} />,
    sortable: true,
    width: 160
  },
  {
    key: 'status',
    header: 'Status',
    value: (c) => c.status,
    cell: (c) => <Badge tone={CLASS_TONES[c.status]}>{c.status}</Badge>,
    sortable: true,
    width: 120
  }
];

export function TimetablePage() {
  const [attendeeMode, setAttendeeMode] = useState<AttendeeMode>('inline');

  const [processingMode, setProcessingMode] = useState<DataMode>('client');

  const [day, setDay] = useState<DayFilter>('all');

  const [sort, setSort] = useState<SortState>({ key: 'time', direction: 'asc' });

  const [page, setPage] = useState<PageState>({ pageIndex: 0, pageSize: 10 });

  const timetable = useTimetable({ attendeeMode, processingMode, day, sort, page });

  const expand = useMemo(
    () => createAttendeeExpansion(attendeeMode, processingMode),
    [attendeeMode, processingMode]
  );

  function selectDay(nextDay: DayFilter) {
    setDay(nextDay);
    setPage((current) => ({ ...current, pageIndex: 0 }));
  }

  function selectProcessingMode(nextMode: DataMode) {
    setProcessingMode(nextMode);
    setPage((current) => ({ ...current, pageIndex: 0 }));
  }

  return (
    <PageLayout
      label="Studio schedule"
      title="Class timetable"
      description="Manage weekly classes, capacity, and attendee bookings."
    >
      <ScheduleToolbar
        stats={timetable.stats}
        status={timetable.status}
        selectedDay={day}
        onSelectDay={selectDay}
      />
      <DemoControls
        onReload={timetable.retry}
        attendeeMode={attendeeMode}
        onAttendeeModeChange={setAttendeeMode}
        processingMode={processingMode}
        onProcessingModeChange={selectProcessingMode}
      />
      {/* A new mode starts a fresh table: open rows and loaded attendees belong to the old mode. */}
      <DataTable
        key={`${attendeeMode}-${processingMode}`}
        rows={timetable.rows}
        columns={classColumns}
        getRowId={(session) => session.id}
        getRowLabel={classLabel}
        caption={day === 'all' ? 'Classes this week' : `Classes on ${DAYS[day]}`}
        emptyText={day === 'all' ? 'No classes this week' : `No classes on ${DAYS[day]}`}
        mode={processingMode}
        totalRows={timetable.stats.total}
        sort={sort}
        onSortChange={setSort}
        page={page}
        onPageChange={setPage}
        status={timetable.status}
        onRetry={timetable.retry}
        expand={expand}
      />
    </PageLayout>
  );
}

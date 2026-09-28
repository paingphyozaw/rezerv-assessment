import { useCallback, useState } from 'react';
import { getAttendees, getAttendeesPage, type AttendeeMode, type TimetableRow } from './api';
import { Badge, type BadgeTone } from '../../components/Badge';
import {
  DataTable,
  type Column,
  type DataMode,
  type Expand,
  type PageState,
  type SortState
} from '../../components/data-table';
import { pageRows } from '../../components/data-table/paging';
import type { Attendee, BookingStatus, ClassSession, PaymentType } from './data';
import { classLabel } from './schedule';
import { useAsync } from '../../hooks/useAsync';

const BOOKING_TONES: Record<BookingStatus, BadgeTone> = {
  Booked: 'blue',
  'Checked-in': 'green',
  Cancelled: 'gray',
  'No-show': 'red'
};

const PAYMENT_TONES: Record<PaymentType, BadgeTone> = {
  'One-time': 'gray',
  Package: 'violet',
  Membership: 'green'
};

const attendeeColumns: Column<Attendee>[] = [
  { key: 'name', header: 'Name', value: (a) => a.name, sortable: true, width: 200, pinned: true },
  {
    key: 'paymentType',
    header: 'Payment',
    value: (a) => a.paymentType,
    cell: (a) => <Badge tone={PAYMENT_TONES[a.paymentType]}>{a.paymentType}</Badge>,
    sortable: true,
    width: 140
  },
  {
    key: 'bookingStatus',
    header: 'Booking',
    value: (a) => a.bookingStatus,
    cell: (a) => <Badge tone={BOOKING_TONES[a.bookingStatus]}>{a.bookingStatus}</Badge>,
    sortable: true,
    width: 140
  }
];

const INITIAL_PAGE: PageState = { pageIndex: 0, pageSize: 5 };

const EMPTY_TEXT = 'No attendees yet';

const attendeeTableProps = {
  columns: attendeeColumns,
  getRowId: (attendee: Attendee) => attendee.id,
  emptyText: EMPTY_TEXT,
  pageSizes: [5, 10, 25]
};

function ServerAttendeeTable({
  session,
  included
}: {
  session: ClassSession;
  included?: Attendee[];
}) {
  const [sort, setSort] = useState<SortState>(null);

  const [page, setPage] = useState(INITIAL_PAGE);

  const load = useCallback(
    (signal: AbortSignal) => getAttendeesPage(session.id, { sort, page }, signal),
    [session.id, sort, page]
  );

  // Inline expansion already has every attendee, so its first page shows without a request.
  // useAsync reads this on the first render only; later sort and page changes ask the mock server.
  const initialData =
    included === undefined
      ? undefined
      : { items: pageRows(included, INITIAL_PAGE), total: included.length };

  const result = useAsync(load, initialData);

  return (
    <DataTable
      {...attendeeTableProps}
      caption={`Attendees of ${classLabel(session)}`}
      rows={result.data?.items ?? []}
      mode="server"
      totalRows={result.data?.total ?? 0}
      sort={sort}
      onSortChange={setSort}
      page={page}
      onPageChange={setPage}
      status={result.status}
      onRetry={result.retry}
    />
  );
}

/** Selects where attendee data comes from, without adding domain logic to DataTable. */
export function createAttendeeExpansion(
  attendeeMode: AttendeeMode,
  processingMode: DataMode
): Expand<TimetableRow, Attendee> {
  const renderChildren = (attendees: Attendee[], session: ClassSession) =>
    processingMode === 'server' ? (
      <ServerAttendeeTable session={session} included={attendees} />
    ) : (
      <DataTable
        {...attendeeTableProps}
        rows={attendees}
        caption={`Attendees of ${classLabel(session)}`}
      />
    );

  if (attendeeMode === 'inline') {
    return {
      mode: 'inline',
      getChildren: (session) => session.attendees ?? [],
      renderChildren,
      emptyText: EMPTY_TEXT
    };
  }

  if (processingMode === 'server') {
    // Mounted on expansion: this component owns the only request, error, and retry state.
    return {
      mode: 'render',
      renderContent: (session) => <ServerAttendeeTable session={session} />
    };
  }

  return {
    mode: 'lazy',
    loadChildren: (session, signal) => getAttendees(session.id, signal),
    renderChildren,
    emptyText: EMPTY_TEXT
  };
}

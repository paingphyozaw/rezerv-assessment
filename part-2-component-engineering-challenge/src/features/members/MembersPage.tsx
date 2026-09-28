import { useCallback, useState } from 'react';
import { getMembers } from './api';
import { Badge, type BadgeTone } from '../../components/Badge';
import {
  DataTable,
  type Column,
  type PageState,
  type SortState
} from '../../components/data-table';
import { DemoControls } from '../../components/DemoControls';
import { PageLayout } from '../../components/PageLayout';
import type { Member, MemberStatus, Plan } from './data';
import { useAsync } from '../../hooks/useAsync';
import { formatDate } from '../../lib/format';

const STATUS_TONES: Record<MemberStatus, BadgeTone> = {
  Active: 'green',
  Paused: 'amber',
  Expired: 'gray'
};

const PLAN_TONES: Record<Plan, BadgeTone> = {
  'Drop-in': 'gray',
  Monthly: 'blue',
  Annual: 'violet',
  'Class pack': 'amber'
};

// A differently shaped dataset, to show the same table is not tied to classes.
const memberColumns: Column<Member>[] = [
  {
    key: 'name',
    header: 'Name',
    value: (m) => m.name,
    cell: (m) => <span className="font-medium text-slate-900">{m.name}</span>,
    sortable: true,
    width: 180,
    pinned: true
  },
  { key: 'email', header: 'Email', value: (m) => m.email, sortable: true, width: 260 },
  {
    key: 'plan',
    header: 'Plan',
    value: (m) => m.plan,
    cell: (m) => <Badge tone={PLAN_TONES[m.plan]}>{m.plan}</Badge>,
    sortable: true,
    width: 120
  },
  { key: 'joined', header: 'Joined', value: (m) => m.joined, sortable: true, width: 130 },
  {
    key: 'visits',
    header: 'Visits',
    value: (m) => m.visits,
    sortable: true,
    width: 90,
    align: 'right'
  },
  {
    key: 'lastVisit',
    header: 'Last visit',
    value: (m) => m.lastVisit,
    cell: (m) =>
      m.lastVisit ? formatDate(m.lastVisit) : <span className="text-slate-400">Never</span>,
    sortable: true,
    width: 130
  },
  {
    key: 'status',
    header: 'Status',
    value: (m) => m.status,
    cell: (m) => <Badge tone={STATUS_TONES[m.status]}>{m.status}</Badge>,
    sortable: true,
    width: 110
  }
];

/**
 * Server-side mode: this page owns sort and page (controlled) and asks the
 * mock API for one sorted page of 5,000 members at a time.
 */
export function MembersPage() {
  const [sort, setSort] = useState<SortState>(null);

  const [page, setPage] = useState<PageState>({ pageIndex: 0, pageSize: 10 });

  const load = useCallback(
    (signal: AbortSignal) => getMembers({ sort, page }, signal),
    [sort, page]
  );

  const result = useAsync(load);

  return (
    <PageLayout
      label="Studio directory"
      title="Members"
      description="Server-side: each sort or page change asks the mock API for one sorted page."
    >
      <DemoControls onReload={result.retry} />
      <DataTable
        rows={result.data?.items ?? []}
        columns={memberColumns}
        getRowId={(m) => m.id}
        getRowLabel={(m) => m.name}
        caption="Members"
        emptyText="No members found"
        mode="server"
        totalRows={result.data?.total ?? 0}
        sort={sort}
        onSortChange={setSort}
        page={page}
        onPageChange={setPage}
        status={result.status}
        onRetry={result.retry}
      />
    </PageLayout>
  );
}

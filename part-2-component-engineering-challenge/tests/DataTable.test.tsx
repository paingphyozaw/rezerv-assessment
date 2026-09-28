import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from '../src/components/data-table/DataTable';
import type { Column, DataTableProps, Expand } from '../src/components/data-table/types';

interface Kid {
  id: string;
  name: string;
}
interface Person {
  id: string;
  name: string;
  age: number;
  kids: Kid[];
}

const people: Person[] = Array.from({ length: 25 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Person ${i + 1}`,
  age: 20 + ((i * 7) % 30),
  kids: i === 0 ? [{ id: 'k1', name: 'Kid One' }] : []
}));

const columns: Column<Person>[] = [
  {
    key: 'name',
    value: (row) => row.name,
    header: 'Name',
    sortable: true,
    width: 160,
    pinned: true
  },
  { key: 'age', value: (row) => row.age, header: 'Age', sortable: true, align: 'right' }
];

const renderKids = (kids: Kid[]) => (
  <ul>
    {kids.map((kid) => (
      <li key={kid.id}>
        <button>{kid.name}</button>
      </li>
    ))}
  </ul>
);

function renderTable(props: Partial<DataTableProps<Person, Kid>> = {}) {
  return render(
    <DataTable<Person, Kid>
      rows={people}
      columns={columns}
      getRowId={(p) => p.id}
      getRowLabel={(p) => p.name}
      caption="People"
      {...props}
    />
  );
}

const bodyRows = () =>
  within(screen.getByRole('table', { name: 'People' }))
    .getAllByRole('row')
    .slice(1);

const names = () => bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent);

describe('DataTable', () => {
  it('clamps an out-of-range page when the dataset shrinks', async () => {
    const user = userEvent.setup();

    const { rerender } = renderTable({ defaultPage: { pageIndex: 99, pageSize: 10 } });

    expect(screen.getByText('21–25 of 25')).toBeInTheDocument();
    rerender(
      <DataTable
        rows={people.slice(0, 12)}
        columns={columns}
        getRowId={(row) => row.id}
        caption="People"
      />
    );
    expect(screen.getByText('11–12 of 12')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Age' }));
    expect(screen.getByText('1–10 of 12')).toBeInTheDocument();
  });

  it('sorts ascending, descending, then back to the original order', async () => {
    const user = userEvent.setup();

    renderTable();

    const header = screen.getByRole('columnheader', { name: /age/i });

    expect(header).toHaveAttribute('aria-sort', 'none');

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(names().slice(0, 2)).toEqual(['Person 1', 'Person 14']);

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(names()[0]).toBe('Person 18');

    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'none');
    expect(names().slice(0, 2)).toEqual(['Person 1', 'Person 2']);
  });

  it('moves between pages and changes the page size', async () => {
    const user = userEvent.setup();

    renderTable();
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('1–10 of 25')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('11–20 of 25')).toBeInTheDocument();
    expect(names()[0]).toBe('Person 11');
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');

    await user.selectOptions(screen.getByLabelText('Rows per page'), '25');
    expect(screen.getByText('1–25 of 25')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(25);
  });

  it('shows skeleton rows that match the columns while loading', () => {
    const { container } = renderTable({ status: 'loading' });

    const skeletons = container.querySelectorAll('[data-skeleton-row]');

    expect(skeletons).toHaveLength(10);
    expect(skeletons[0].querySelectorAll('td')).toHaveLength(2);
    expect(screen.getByRole('table', { name: 'People' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByLabelText('Rows per page')).not.toBeInTheDocument();
  });

  it('shows an error with a working Try again button', async () => {
    const user = userEvent.setup();

    const onRetry = vi.fn();

    renderTable({ status: 'error', onRetry });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load data');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty text when there are no rows', () => {
    renderTable({ rows: [], emptyText: 'No people yet' });
    expect(screen.getByText('No people yet')).toBeInTheDocument();
  });

  it('keeps the toggle column exactly as wide as the pinned offset assumes', () => {
    renderTable({
      expand: { mode: 'inline', getChildren: (p) => p.kids, renderChildren: renderKids }
    });

    const toggleCell = screen
      .getByRole('button', { name: 'Show details for Person 1' })
      .closest('td')!;

    const header = screen.getByRole('columnheader', { name: /name/i });

    expect(header.className).toContain('sticky');
    expect(header.style.left).toBe(toggleCell.style.width);
  });

  it('opens inline child rows, and shows the empty text for rows without children', async () => {
    const user = userEvent.setup();

    const expand: Expand<Person, Kid> = {
      mode: 'inline',
      getChildren: (p) => p.kids,
      renderChildren: renderKids,
      emptyText: 'No kids'
    };

    renderTable({ expand });

    const toggle = screen.getByRole('button', { name: 'Show details for Person 1' });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Kid One')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByRole('button', { name: 'Kid One' })).not.toBeInTheDocument();
    expect(screen.getByText('Kid One').closest('tr')).toHaveAttribute('inert');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Kid One' }).closest('tr')).not.toHaveAttribute(
      'inert'
    );

    await user.click(screen.getByRole('button', { name: 'Show details for Person 2' }));
    expect(screen.getByText('No kids')).toBeInTheDocument();
  });

  it('loads lazy child rows, shows errors with Try again, and caches the result', async () => {
    const user = userEvent.setup();

    const calls: { resolve: (kids: Kid[]) => void; reject: (error: Error) => void }[] = [];

    const loadChildren = vi.fn(
      () => new Promise<Kid[]>((resolve, reject) => calls.push({ resolve, reject }))
    );

    renderTable({ expand: { mode: 'lazy', loadChildren, renderChildren: renderKids } });

    await user.click(screen.getByRole('button', { name: 'Show details for Person 1' }));
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    await act(async () => calls[0].reject(new Error('down')));
    expect(await screen.findByText('Could not load these rows')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => calls[1].resolve([{ id: 'k1', name: 'Kid One' }]));
    expect(await screen.findByText('Kid One')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide details for Person 1' }));
    await user.click(screen.getByRole('button', { name: 'Show details for Person 1' }));
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it('stops a lazy load when the row is closed, without showing an error', async () => {
    const user = userEvent.setup();

    let signal: AbortSignal | undefined;

    const loadChildren = vi.fn((_: Person, s: AbortSignal) => {
      signal = s;
      return new Promise<Kid[]>(() => {});
    });

    renderTable({ expand: { mode: 'lazy', loadChildren, renderChildren: renderKids } });
    await user.click(screen.getByRole('button', { name: 'Show details for Person 2' }));
    await user.click(screen.getByRole('button', { name: 'Hide details for Person 2' }));
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('in server mode, reports sort and page changes without reordering rows', async () => {
    const user = userEvent.setup();

    const onSortChange = vi.fn();

    const onPageChange = vi.fn();

    renderTable({
      mode: 'server',
      rows: people.slice(0, 10),
      totalRows: 25,
      sort: null,
      onSortChange,
      page: { pageIndex: 0, pageSize: 10 },
      onPageChange
    });
    await user.click(
      within(screen.getByRole('columnheader', { name: /age/i })).getByRole('button')
    );
    expect(onSortChange).toHaveBeenCalledWith({ key: 'age', direction: 'asc' });
    expect(names().slice(0, 2)).toEqual(['Person 1', 'Person 2']);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith({ pageIndex: 1, pageSize: 10 });
    expect(screen.getByText('1–10 of 25')).toBeInTheDocument();
  });
});

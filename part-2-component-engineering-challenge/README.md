# Pulse Studio — Reusable Data Table

A small admin dashboard for a fitness studio, built around one data table component written from scratch. No table or grid library is used.

- **Live site:** _TBD_
- **Code:** [part-2-component-engineering-challenge](https://github.com/paingphyozaw/rezerv-assessment/tree/main/part-2-component-engineering-challenge)

## Setup

Needs Node 22.22+ or 24.15+ (the test tools need this). From the repository root:

```sh
cd part-2-component-engineering-challenge
npm install
npm run dev            # http://127.0.0.1:4175
npm test               # unit and component tests
npm run build          # type check + production build
npm run format:check   # Prettier check
```

## What is built

| View                         | What it shows                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Timetable** (main view)    | 40 classes this week, with a day filter. Open a class to see its attendees in a small table of their own. |
| **Members** (second dataset) | 5,000 members with different columns, sorted and paged by the mock API (server-side).                     |

Both views, and every attendee list, use the same `<DataTable>` component.

## Try it

Open the **Demo tools** panel above the table. A switch changes the _next_ request, so click **Reload data** after you change it.

| To see                        | Do this                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Client-side vs server-side    | On the Timetable, set **Sorting & paging** to Client-side or Server-side.                               |
| Inline vs on-demand attendees | On the Timetable, set **Attendees** to Included with classes or Load on expand.                         |
| Skeleton rows                 | Load the page, or click **Reload data**. Every mock request waits 400–900 ms.                           |
| Empty table                   | Turn on **Empty data**, then click **Reload data**.                                                     |
| Failed load                   | Turn on **Fail next request**, then click **Reload data**. It fails once, so **Try again** works.       |
| Failed attendee load          | Choose **Load on expand** and wait for the list. Turn on **Fail next request**, then open a class.      |
| Class with no attendees       | Open a **Cancelled** class.                                                                             |
| Page out of range             | Go to the last page, turn on **Empty data**, then click **Reload data**. The table goes back to page 1. |
| Pinned column on a phone      | Make the window narrow, then scroll the table sideways.                                                 |
| Large dataset                 | Open **Members** (5,000 rows).                                                                          |
| Unknown sort key              | There is no button for this. See `tests/table-model.test.ts`.                                           |

## Component API

```tsx
<DataTable<ClassWithAttendees, Attendee>
  rows={classes}
  columns={classColumns}
  getRowId={(c) => c.id}
  caption="Classes this week"
  status={status} // 'loading' | 'error' | 'ready'
  onRetry={retry}
  defaultSort={{ key: 'time', direction: 'asc' }} // or pass sort + onSortChange to control it
  expand={attendeeExpand} // built once with useMemo, see "Expandable rows"
/>
```

The table is generic: `T` is the row type and `C` is the child row type, so every callback is typed. All props are in [`types.ts`](src/components/data-table/types.ts).

### Column definitions

```tsx
{
  key: 'attendance',                        // unique id; also the sort key
  header: 'Attendance',
  value: attendanceRatio,                   // what it sorts by (booked / capacity)
  cell: (c) => <Attendance session={c} />,  // what it shows (optional)
  sortable: true,
  width: 160,
  pinned: false,
  align: 'left'
}
```

Every column has a typed `value(row)` function. The table sorts by it, and shows it when there is no `cell`. So `key` does not need to be a field on the row (`attendance` is computed). A pinned column must have a `width`; TypeScript checks this.

## Client-side vs server-side

- **Client** (`mode="client"`, the default; Timetable): the page loads all classes once, and the table sorts them and shows one page. A studio has about 40 classes a week, so this is instant and needs no extra requests.
- **Server** (`mode="server"`; Members, and the Timetable when Server-side is chosen): the table does not sort or slice. It calls `onSortChange` and `onPageChange`, and the page asks the API for that page and passes `rows` and `totalRows`. Members has 5,000 rows, and a real app would not send all of them to the browser. In development the table warns if `totalRows`, `onSortChange` or `onPageChange` is missing.
- `sort` and `page` work like a React `<input>`: pass them to control them, or leave them out and the table keeps them. Timetable and Members pass them (controlled). The client-side attendee table does not (uncontrolled).
- The mock APIs (`features/*/api.ts`) behave like real endpoints: a delay, an abort signal, sort before page, and `{ items, total }` back.

Rules in both modes:

- Clicking a header goes ascending → descending → not sorted.
- `null` and `undefined` values are always last. Text sorts naturally ("Class 2" before "Class 10").
- Changing the sort goes back to page 1.
- A page past the end becomes the last page.
- An unknown sort key is ignored, with a warning in development.

## Expandable rows

Opening a row shows a full-width row under it. It opens and closes with a 200 ms CSS grid animation (`grid-template-rows` 0fr → 1fr), so no height has to be measured.

- **Inline** (`mode: 'inline'`): the child rows come with the parent row (`getChildren(row)`).
- **On demand** (`mode: 'lazy'`): the child rows load the first time the row opens (`loadChildren(row, signal)`).
  - While loading, it shows skeleton lines. If the request fails, it shows an error with **Try again**.
  - Loaded rows are cached, so opening the row again does not reload.
  - Closing the row while it loads cancels the request, without an error.
- An empty child list shows a message ("No attendees yet").
- A third mode, `mode: 'render'`, shows a component that loads its own data. The server-side attendee table uses it, so it asks for one page of attendees instead of all of them.

The same attendee columns are used in every mode:

| Demo setting                 | First attendee data                           | When the attendee sort or page changes |
| ---------------------------- | --------------------------------------------- | -------------------------------------- |
| Included + Client-side       | Comes with the class                          | Sorted in the browser                  |
| Load on expand + Client-side | All attendees fetched once, then cached       | Sorted in the browser                  |
| Included + Server-side       | Page 1 comes from the class data (no request) | Asks the server                        |
| Load on expand + Server-side | Asks the server for page 1                    | Asks the server                        |

Closing a server-side attendee table stops its request, and opening it again starts at page 1. Changing a demo setting closes all rows and clears loaded attendees.

## Sticky column

- It is one real `<table>`. Cells with `pinned: true` use `position: sticky`, so the other columns slide under them when you scroll sideways. I did not use two tables side by side, because their row heights can get out of line.
- A pinned column needs a `width`, because the table uses it to work out where the next sticky cell starts. The expand-button column is sticky too.
- A shadow shows on the pinned column's right edge once you scroll.
- A pinned column is never wider than 40% of the viewport (`min(width, 40vw)`), so on a phone the other columns still have room.

## Loading, empty, and error states

- **Loading:** skeleton rows that match the columns, so nothing jumps when the data arrives.
- **Server-side, new page or sort:** the old rows stay on screen, dimmed, until the new ones arrive.
- **Error:** a message with **Try again**. **Empty:** a short message.
- The same message style is used in the table and inside opened rows.

## State management

Only React's own hooks. There is no Redux, Zustand, or React Query.

- **Table state** (sort, page, open rows) lives inside the table in `useState`. It belongs to one table, so a global store would only add code. It also means every attendee table gets its own sort and page.
- **Controlled or not:** a page can pass `sort`/`page` with `onSortChange`/`onPageChange` to own that state. Server mode needs this, because the page sends the sort and page to the API. The Timetable page also owns them, so the sort stays when you change a demo setting.
- **Loading data:** page requests go through a small `useAsync` hook. Each request gets an `AbortController`, and a new request cancels the old one, so a slow old answer never replaces a newer one. On-demand child rows use `useChildRows`, which caches each row's result.
- React Query helps when many screens share the same data. Here each table loads its own data, so it is not needed.

## Accessibility

- A real `<table>` with a caption and header cells.
- Each sortable header cell has `aria-sort`, with a button inside. Expand buttons use `aria-expanded` and a label such as "Show details for Yoga Flow, Mon 6:00 AM". The current page has `aria-current`.
- Everything works with the keyboard and shows a focus ring.

## Performance

- Sorting and paging are memoized. Rows are memoized too, so opening one row does not re-render the others.
- Only one page of rows is drawn, so no virtualization is needed.
- Scrolling only changes state when the pinned column's shadow turns on or off.
- A test sorts 5,000 rows and checks the result.

## Where to look

- `src/components/data-table/`: the reusable table. Start with `DataTable.tsx` (rendering), `useDataTable.ts` (sort, page, and open rows), and `types.ts` (props and columns). `useChildRows.ts` loads, caches, and cancels on-demand child rows. `sorting.ts` and `paging.ts` are plain functions, also used by the mock API.
- `src/features/timetable/` and `src/features/members/`: the two pages, each with its own columns, mock API, and data.
- `src/hooks/useAsync.ts`: loading and cancelling requests. `src/lib/mockApi.ts`: the fake server (delay, demo switches, sort then page).
- `tests/`: table behavior, sort and page rules, and `useAsync`.

The table has no studio-specific imports.

## Testing

`npm test` runs the tests in three files (Vitest and Testing Library):

- **DataTable:** sort cycling, page navigation and page size, a page that goes out of range when the data shrinks, pinned offsets, skeleton, empty and error states, inline and on-demand child rows (retry, cache, cancel on close), and server mode.
- **Table model:** natural text order, empty values, ties, dates, unknown sort keys, a 5,000-row sort, invalid page input, and page-button edge cases.
- **useAsync:** initial data in Strict Mode, error and retry, keeping data while refreshing, and ignoring a cancelled request.

`npm run build` also type-checks the tests. jsdom does not lay out the page, so the sticky column and sideways scrolling are checked in a real browser.

## Trade-offs and assumptions

- Client mode loads every class at once. That is fine for about 40 classes; big lists should use server mode, like Members.
- Loaded attendees are kept only while the table is on screen, and are not refreshed.
- Columns can be pinned on the left only. Each demo table pins one column.
- The table has no column filters, column resizing, row selection, or virtualization; the brief does not ask for them. The Timetable's day filter belongs to the page, not the table.
- Mock data uses a fixed seed, so it is the same on every load. Each mock request waits 400–900 ms. Browser network throttling does not slow it, because the delay is a JavaScript timer.
- Views switch with the URL hash (`#/timetable`, `#/members`), so any static host works without rewrite rules.
- Styling uses Tailwind. Icons come from `lucide-react`, which is not a table library.

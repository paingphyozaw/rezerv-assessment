import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/format';
import { pageButtons } from './paging';

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  pageSizes: number[];
  total: number;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const BUTTON =
  'grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:pointer-events-none disabled:opacity-40';

export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  pageSizes,
  total,
  onPageIndexChange,
  onPageSizeChange
}: PaginationProps) {
  const first = total === 0 ? 0 : pageIndex * pageSize + 1;

  const last = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-t border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 sm:flex sm:justify-between sm:px-4">
      <label className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="whitespace-nowrap">Rows per page</span>
        <span className="relative inline-flex">
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="min-h-8 appearance-none rounded-md border border-slate-300 bg-white py-1 pl-2.5 pr-7 text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-slate-500"
          />
        </span>
      </label>
      <p className="justify-self-end text-xs tabular-nums">
        {formatNumber(first)}–{formatNumber(last)} of {formatNumber(total)}
      </p>
      {pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="col-span-2 flex items-center justify-center gap-1 sm:col-span-1"
        >
          <IconButton
            label="Previous page"
            disabled={pageIndex === 0}
            onClick={() => onPageIndexChange(pageIndex - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </IconButton>
          {pageButtons(pageIndex, pageCount).map((item, i) =>
            item === 'gap' ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="hidden px-1 text-slate-400 sm:inline"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === pageIndex ? 'page' : undefined}
                onClick={() => onPageIndexChange(item)}
                className={cn(
                  BUTTON,
                  item !== pageIndex && item !== 0 && item !== pageCount - 1 && 'hidden sm:grid',
                  'tabular-nums',
                  item === pageIndex
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                {item + 1}
              </button>
            )
          )}
          <IconButton
            label="Next page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageIndexChange(pageIndex + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </IconButton>
        </nav>
      )}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(BUTTON, 'text-slate-700 hover:bg-slate-100')}
    >
      {children}
    </button>
  );
}

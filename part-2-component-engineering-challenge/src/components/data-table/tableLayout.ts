import { useMemo, type CSSProperties } from 'react';
import { cn } from '../../lib/cn';
import type { Column } from './types';

const TOGGLE_WIDTH = 44;

// Padding is kept out of the shared cell styles, because `cn` does not merge
// Tailwind classes: the toggle cells need px-2 to be exactly TOGGLE_WIDTH wide.
export const HEADER_BASE =
  'border-b border-slate-200 bg-slate-50/90 py-2.5 text-[10px] font-semibold tracking-[0.08em] text-slate-500 uppercase whitespace-nowrap';

const BODY_BASE =
  'border-b border-slate-100 bg-white py-2.5 align-middle text-[13px] text-slate-700 group-hover:bg-slate-50';

export const HEADER_CELL = `${HEADER_BASE} px-3`;

const BODY_CELL = `${BODY_BASE} px-3`;

export const SHADOW = 'shadow-[6px_0_8px_-6px_rgb(15_23_42/0.35)]';

/** The expand-button column. Pinned columns start right after it. */
export const TOGGLE_STYLE: CSSProperties = { width: TOGGLE_WIDTH, minWidth: TOGGLE_WIDTH, left: 0 };

/** A pinned column is never wider than 40% of the screen. */
const pinnedWidth = (width: number) => `min(${width}px, 40vw)`;

export interface PinnedLayout {
  anyPinned: boolean;
  left: Map<string, number | string>;
  lastPinned: string | null;
}

/** Where each pinned column sticks: it starts where the pinned columns before it end. */
export function usePinnedLayout<T>(columns: Column<T>[], hasToggle: boolean): PinnedLayout {
  return useMemo(() => {
    const anyPinned = columns.some((column) => column.pinned);

    const left = new Map<string, number | string>();

    const start = hasToggle && anyPinned ? TOGGLE_WIDTH : 0;

    const widths: string[] = [];

    for (const column of columns) {
      if (!column.pinned) continue;
      left.set(column.key, widths.length ? `calc(${start}px + ${widths.join(' + ')})` : start);
      widths.push(pinnedWidth(column.width));
    }

    const lastPinned = [...columns].reverse().find((column) => column.pinned)?.key ?? null;

    return { anyPinned, left, lastPinned };
  }, [columns, hasToggle]);
}

/** Width and sticky position of a column. */
export function columnStyle<T>(
  column: Column<T>,
  left: number | string | undefined
): CSSProperties {
  const width =
    column.width === undefined
      ? undefined
      : column.pinned
        ? pinnedWidth(column.width)
        : `${column.width}px`;

  return {
    width,
    minWidth: width,
    maxWidth: column.pinned ? width : undefined,
    left,
    textAlign: column.align
  };
}

/** The expand-button cell of a body row. Skeleton rows use it too, so nothing jumps when data arrives. */
export function toggleCellProps(layout: PinnedLayout) {
  return {
    style: TOGGLE_STYLE,
    className: cn(BODY_BASE, 'px-2', layout.anyPinned && 'sticky z-10')
  };
}

/** A body cell's size, sticky position and classes. Real rows and skeleton rows share it. */
export function bodyCellProps<T>(column: Column<T>, layout: PinnedLayout, scrolled: boolean) {
  return {
    style: columnStyle(column, layout.left.get(column.key)),
    className: cn(
      BODY_CELL,
      column.pinned && 'sticky z-10',
      column.key === layout.lastPinned && scrolled && SHADOW
    )
  };
}

import { ChevronDown, RotateCw, SlidersHorizontal } from 'lucide-react';
import { useId, useSyncExternalStore } from 'react';
import type { AttendeeMode } from '../features/timetable/api';
import { demoSettings } from '../lib/mockApi';
import type { DataMode } from './data-table';

interface DemoControlsProps {
  onReload: () => void;
  attendeeMode?: AttendeeMode;
  onAttendeeModeChange?: (mode: AttendeeMode) => void;
  processingMode?: DataMode;
  onProcessingModeChange?: (mode: DataMode) => void;
}

/** Collapsible switches for demonstrating loading, error, and empty states. */
export function DemoControls({
  onReload,
  attendeeMode,
  onAttendeeModeChange,
  processingMode,
  onProcessingModeChange
}: DemoControlsProps) {
  const settings = useSyncExternalStore(demoSettings.subscribe, demoSettings.get);

  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 marker:hidden hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-500 [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal aria-hidden="true" className="size-4 text-slate-500" />
        <span>Demo tools</span>
        <span className="hidden font-normal text-slate-400 sm:inline">
          Change mock responses, attendee loading, and table processing
        </span>
        <ChevronDown
          aria-hidden="true"
          className="ml-auto size-4 text-slate-400 transition-transform group-open:rotate-180"
        />
      </summary>

      <fieldset className="flex min-w-0 items-center gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2 text-xs text-slate-600 sm:gap-3 sm:px-4">
        <legend className="sr-only">Demo tools</legend>
        <Switch
          label="Fail next request"
          checked={settings.failNextRequest}
          onChange={(failNextRequest) => demoSettings.set({ failNextRequest })}
        />
        <Switch
          label="Empty data"
          checked={settings.emptyData}
          onChange={(emptyData) => demoSettings.set({ emptyData })}
        />
        {attendeeMode && onAttendeeModeChange && (
          <ModeGroup
            label="Attendees"
            groupLabel="Attendee loading mode"
            value={attendeeMode}
            onChange={onAttendeeModeChange}
            options={[
              { value: 'inline', label: 'Included with classes' },
              { value: 'lazy', label: 'Load on expand' }
            ]}
          />
        )}
        {processingMode && onProcessingModeChange && (
          <ModeGroup
            label="Sorting & paging"
            groupLabel="Sorting and pagination mode"
            value={processingMode}
            onChange={onProcessingModeChange}
            options={[
              { value: 'client', label: 'Client-side' },
              { value: 'server', label: 'Server-side' }
            ]}
          />
        )}
        <button
          type="button"
          onClick={onReload}
          className="ml-auto inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          <RotateCw aria-hidden="true" className="size-3.5" />
          Reload data
        </button>
      </fieldset>
    </details>
  );
}

interface ModeGroupProps<M extends string> {
  label: string;
  groupLabel: string;
  value: M;
  onChange: (value: M) => void;
  options: { value: M; label: string }[];
}

/** A labelled row of radio buttons that looks like a segmented control. */
function ModeGroup<M extends string>({
  label,
  groupLabel,
  value,
  onChange,
  options
}: ModeGroupProps<M>) {
  const name = useId();

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-l border-slate-200 pl-2 sm:gap-2 sm:pl-3">
      <span className="whitespace-nowrap text-xs font-medium text-slate-500">{label}</span>
      <div role="radiogroup" aria-label={groupLabel} className="flex shrink-0 gap-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-8 cursor-pointer items-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-indigo-500"
          >
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-1.5 transition-colors hover:text-slate-900 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-indigo-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 accent-indigo-600"
      />
      {label}
    </label>
  );
}

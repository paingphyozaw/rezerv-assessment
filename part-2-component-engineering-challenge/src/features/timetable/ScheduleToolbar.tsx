import type { TableStatus } from '../../components/data-table';
import { DAYS, type DayFilter, type ScheduleStats } from './schedule';
import { cn } from '../../lib/cn';

interface ScheduleToolbarProps {
  status: TableStatus;
  selectedDay: DayFilter;
  onSelectDay: (day: DayFilter) => void;
  stats: ScheduleStats;
}

export function ScheduleToolbar({ status, selectedDay, onSelectDay, stats }: ScheduleToolbarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-4">
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-semibold tracking-wide text-slate-400 uppercase sm:mb-1">
          This week
        </p>
        <div
          role="group"
          aria-label="Filter timetable by day"
          className="flex gap-1 overflow-x-auto pb-0.5"
        >
          <DayButton
            label="All days"
            active={selectedDay === 'all'}
            onClick={() => onSelectDay('all')}
          />
          {DAYS.map((day, index) => (
            <DayButton
              key={day}
              label={day}
              active={selectedDay === index}
              onClick={() => onSelectDay(index)}
            />
          ))}
        </div>
      </div>
      <p className="shrink-0 text-xs text-slate-500" aria-live="polite">
        <ScheduleSummary status={status} stats={stats} />
      </p>
    </div>
  );
}

/** The class counts, or a short status while loading or after an error. */
function ScheduleSummary({ status, stats }: { status: TableStatus; stats: ScheduleStats }) {
  if (status === 'loading') return 'Loading schedule…';
  if (status === 'error') return 'Schedule unavailable';
  return (
    <>
      <span className="font-semibold text-slate-800">{stats.total}</span> classes
      <span className="mx-2 text-slate-300">·</span>
      <span className="font-medium text-slate-600">{stats.booked} booked</span>
      <span className="mx-2 text-slate-300">·</span>
      <span className="font-medium text-amber-700">{stats.full} full</span>
      <span className="mx-2 text-slate-300">·</span>
      <span className="font-medium text-slate-500">{stats.cancelled} cancelled</span>
    </>
  );
}

function DayButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-8 shrink-0 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500',
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      {label}
    </button>
  );
}

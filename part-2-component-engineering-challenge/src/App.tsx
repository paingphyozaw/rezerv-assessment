import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from './lib/cn';
import { MembersPage } from './features/members/MembersPage';
import { TimetablePage } from './features/timetable/TimetablePage';

const NAV_ITEMS = [
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'members', label: 'Members', icon: UsersRound }
] as const;

type ViewId = (typeof NAV_ITEMS)[number]['id'];

const readView = (): ViewId => (window.location.hash === '#/members' ? 'members' : 'timetable');

/** Small admin shell shared by the timetable and member directory. */
export function App() {
  const [view, setView] = useState<ViewId>(readView);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeItem = NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0];

  useEffect(() => {
    const onHashChange = () => setView(readView());

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-800 lg:flex">
      <aside
        className={cn(
          'border-b border-slate-200 bg-white px-4 py-3 transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 lg:px-4 lg:py-6',
          sidebarCollapsed ? 'lg:w-[68px] lg:px-2' : 'lg:w-60'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between',
            sidebarCollapsed && 'lg:flex-col lg:justify-center lg:gap-1'
          )}
        >
          <a
            href="#/timetable"
            aria-label="Pulse Studio home"
            className={cn(
              'flex min-h-10 items-center gap-3 rounded-md px-1 font-semibold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500',
              sidebarCollapsed && 'lg:justify-center'
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-900/20">
              <Dumbbell aria-hidden="true" className="size-[18px]" />
            </span>
            <span className={cn('text-[15px]', sidebarCollapsed && 'lg:hidden')}>Pulse Studio</span>
          </a>
          <button
            type="button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="main-navigation"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="hidden size-8 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500 lg:grid lg:size-7"
          >
            {sidebarCollapsed ? (
              <ChevronRight aria-hidden="true" className="size-4" />
            ) : (
              <ChevronLeft aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>

        <div className={cn('mt-7 hidden px-3', !sidebarCollapsed && 'lg:block')}>
          <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            Workspace
          </p>
          <p className="mt-1 text-xs text-slate-500">Studio operations</p>
        </div>

        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={cn(
            'mt-3 flex gap-1 overflow-x-auto lg:mt-5 lg:flex-col',
            sidebarCollapsed && 'lg:mt-8'
          )}
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#/${id}`}
              title={sidebarCollapsed ? label : undefined}
              aria-label={label}
              aria-current={view === id ? 'page' : undefined}
              className={cn(
                'flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500',
                sidebarCollapsed && 'lg:justify-center lg:px-0',
                view === id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon aria-hidden="true" className="size-[17px]" />
              <span className={cn(sidebarCollapsed && 'lg:sr-only')}>{label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-slate-100 pt-4 lg:block">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2',
              sidebarCollapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              PS
            </span>
            <span className={cn('min-w-0', sidebarCollapsed && 'lg:hidden')}>
              <span className="block truncate text-xs font-semibold text-slate-800">
                Pulse Studio
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">Administrator</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Workspace</span>
            <span aria-hidden="true" className="text-slate-300">
              /
            </span>
            <span className="font-medium text-slate-700">{activeItem.label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Demo workspace</span>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1480px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {view === 'timetable' ? <TimetablePage /> : <MembersPage />}
        </main>
      </div>
    </div>
  );
}

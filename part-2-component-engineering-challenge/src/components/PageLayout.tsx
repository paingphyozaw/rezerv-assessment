import { useId, type ReactNode } from 'react';

interface PageLayoutProps {
  /** Small text above the title. */
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** The title block and spacing that every page shares. */
export function PageLayout({ label, title, description, children }: PageLayoutProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="space-y-4 sm:space-y-5">
      <div className="space-y-1">
        <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-600 uppercase">{label}</p>
        <h1
          id={titleId}
          className="text-[22px] font-semibold tracking-tight text-slate-950 sm:text-2xl"
        >
          {title}
        </h1>
        <p className="max-w-2xl text-[13px] leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

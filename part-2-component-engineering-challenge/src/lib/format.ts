/** 630 → "10:30 AM" */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;

  const suffix = hours < 12 ? 'AM' : 'PM';

  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
}

/** new Date(2025, 2, 4) → "Mar 4, 2025" */
export const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** 5000 → "5,000" */
export const formatNumber = (value: number): string => value.toLocaleString('en-US');

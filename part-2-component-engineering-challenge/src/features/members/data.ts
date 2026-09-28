import { createRandom, FIRST_NAMES, LAST_NAMES } from '../../lib/random';

export type Plan = 'Drop-in' | 'Monthly' | 'Annual' | 'Class pack';
export type MemberStatus = 'Active' | 'Paused' | 'Expired';

export interface Member {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  joined: Date;
  visits: number;
  /** null when the member has never visited */
  lastVisit: Date | null;
  status: MemberStatus;
}

const DAY = 24 * 60 * 60 * 1000;

const TODAY = new Date('2026-09-28T00:00:00').getTime();

const PLANS: Plan[] = ['Drop-in', 'Monthly', 'Annual', 'Class pack'];

function buildMembers(count: number): Member[] {
  const random = createRandom(7);

  return Array.from({ length: count }, (_, i) => {
    const first = random.pick(FIRST_NAMES);

    const last = random.pick(LAST_NAMES);

    const joined = TODAY - random.int(10, 1400) * DAY;

    const visits = random.next() < 0.06 ? 0 : random.int(1, 300);

    const lastVisit = visits === 0 ? null : joined + Math.floor(random.next() * (TODAY - joined));

    const idle = lastVisit === null || TODAY - lastVisit > 90 * DAY;

    const status: MemberStatus = idle ? 'Expired' : random.next() < 0.1 ? 'Paused' : 'Active';

    return {
      id: `m-${String(i + 1).padStart(4, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
      plan: random.pick(PLANS),
      joined: new Date(joined),
      visits,
      lastVisit: lastVisit === null ? null : new Date(lastVisit),
      status
    };
  });
}

let cache: Member[] | null = null;

/** All 5,000 members. Built on first use, then kept. */
export function allMembers(): Member[] {
  cache ??= buildMembers(5000);
  return cache;
}

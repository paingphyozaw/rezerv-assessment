/** A small seeded random generator (mulberry32), so the mock data is the same on every load. */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let r = Math.imul(state ^ (state >>> 15), 1 | state);

    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <V>(list: readonly V[]): V => list[Math.floor(next() * list.length)]
  };
}

export const FIRST_NAMES = [
  'Aye',
  'Ben',
  'Chloe',
  'Daniel',
  'Ella',
  'Felix',
  'Grace',
  'Hiro',
  'Isla',
  'Jack',
  'Kyaw',
  'Lena',
  'Mateo',
  'Nora',
  'Omar',
  'Priya',
  'Quinn',
  'Rosa',
  'Sam',
  'Thandi'
] as const;

export const LAST_NAMES = [
  'Adams',
  'Brown',
  'Chen',
  'Diaz',
  'Evans',
  'Fischer',
  'Garcia',
  'Htun',
  'Ito',
  'Johnson',
  'Kim',
  'Lopez',
  'Moore',
  'Nguyen',
  'Okafor',
  'Patel',
  'Rossi',
  'Smith',
  'Tan',
  'Walker'
] as const;

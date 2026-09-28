// Pure periodic choreography. First and last poses match for a seamless wrap.

/** Position as a fraction of the viewport, rotation in degrees, and scale. */
export interface Pose {
  x: number;
  y: number;
  r: number;
  s: number;
}
/** Hero, fly-by, orbit, collage, and hero again, so the loop closes. */
export type PoseCycle = [Pose, Pose, Pose, Pose, Pose];

export const modulo = (value: number, length = 1): number =>
  ((value % length) + length) % length;
export const clamp = (value: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, value));
export const smooth = (value: number): number => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
export function windowOpacity(
  phase: number,
  start: number,
  end: number,
  feather = 0.07
): number {
  return (
    smooth((phase - start) / feather) *
    (1 - smooth((phase - end + feather) / feather))
  );
}
const hero: [x: number, y: number, r: number, s: number][] = [
  [0.12, 0.22, -25, 1.12],
  [0.84, 0.17, 20, 0.9],
  [0.91, 0.67, -18, 1.12],
  [0.1, 0.77, 25, 0.92],
  [0.69, 0.89, -15, 0.65],
  [0.49, -0.12, 155, 0.85],
  [-0.12, 0.44, 40, 0.7],
  [1.12, 0.34, -30, 0.8]
];
export function posesFor(
  index: number,
  count: number,
  mobile: boolean
): PoseCycle {
  const base = hero[index % hero.length];
  const first: Pose =
    index < 8
      ? { x: base[0], y: base[1], r: base[2], s: base[3] }
      : {
          x: index % 2 ? 1.3 : -0.3,
          y: (index - 8) / Math.max(1, count - 8),
          r: index * 37,
          s: 0.6
        };
  if (mobile && index < 8) {
    const positions: [x: number, y: number][] = [
      [0.16, 0.22],
      [0.86, 0.2],
      [1, 0.72],
      [0.04, 0.81],
      [0.53, 0.94],
      [0.5, -0.2],
      [-0.3, 0.45],
      [1.3, 0.45]
    ];
    first.x = positions[index][0];
    first.y = positions[index][1];
  }
  const angle = (index / count) * Math.PI * 2;
  const orbit: Pose = {
    x: 0.5 + Math.cos(angle) * (0.43 + (index % 3) * 0.12),
    y: 0.5 + Math.sin(angle) * (0.43 + (index % 2) * 0.12),
    r: index * 31 - 70,
    s: index % 4 === 0 ? 0.95 : 0.5 + (index % 3) * 0.12
  };
  const columns = mobile ? 4 : 6;
  const rows = Math.ceil(count / columns);
  const collage: Pose = {
    x: ((index % columns) + 0.5) / columns,
    y: (Math.floor(index / columns) + 0.5) / rows,
    r: (index % 2 ? 1 : -1) * (12 + (index % 4) * 6),
    s: mobile ? 1.25 : 1.35
  };
  const fly: Pose = {
    x: 0.5 + (first.x - 0.5) * 1.7,
    y: 0.5 + (first.y - 0.5) * 1.6,
    r: first.r + 100,
    s: index === 0 ? 3.8 : 0.4
  };
  return [first, fly, orbit, collage, first];
}
const stops = [0, 0.23, 0.45, 0.72, 1];
export function poseAt(poses: PoseCycle, phase: number): Pose {
  const p = modulo(phase);
  const index = stops.findIndex(
    (stop, i) => i < stops.length - 1 && p >= stop && p < stops[i + 1]
  );
  const i = Math.max(0, index);
  const t = smooth((p - stops[i]) / (stops[i + 1] - stops[i]));
  const a = poses[i],
    b = poses[i + 1];
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    r: mix(a.r, b.r, t),
    s: mix(a.s, b.s, t)
  };
}

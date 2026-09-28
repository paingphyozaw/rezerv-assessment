// Where every character is at each point of the scroll loop, and when each
// scene fades in and out. Plain data with no DOM or GSAP, so it is easy to test.

/** x and y are fractions of the screen (0 to 1), r is rotation in degrees, s is scale. */
export interface Pose {
  x: number;
  y: number;
  r: number;
  s: number;
}
/** Hero, fly-by, orbit, grid, then hero again, so the loop joins up. */
export type PoseList = [Pose, Pose, Pose, Pose, Pose];
/** Fully shown from start + fade to end - fade, fading in and out at the edges. */
export interface FadeRange {
  start: number;
  end: number;
  fade: number;
}
export type SceneNumber = 0 | 1 | 2;

/** Scroll progress (0 to 1) at which each pose in a PoseList is reached. */
export const POSE_TIMES = [0, 0.23, 0.45, 0.72, 1] as const;

export const FADES = {
  heroOut: { start: 0.07, end: 0.95, fade: 0.13 },
  orbitText: { start: 0.27, end: 0.6, fade: 0.09 },
  gridText: { start: 0.59, end: 0.89, fade: 0.075 },
  space: { start: 0.22, end: 0.65, fade: 0.13 },
  greenBackground: { start: 0.52, end: 0.92, fade: 0.13 }
} satisfies Record<string, FadeRange>;

/** Where each scene becomes the most visible one. */
export const SCENE_START = {
  orbit: 0.27,
  grid: 0.5946,
  heroAgain: 0.8644
} as const;
/** Where the dark space background is mostly visible, so the header turns light. */
export const SPACE = { start: 0.2893, end: 0.5807 } as const;

export function getScene(progress: number): SceneNumber {
  if (progress < SCENE_START.orbit || progress >= SCENE_START.heroAgain)
    return 0;
  return progress < SCENE_START.grid ? 1 : 2;
}
export const isInSpace = (progress: number): boolean =>
  progress >= SPACE.start && progress < SPACE.end;

const heroPoses: [x: number, y: number, r: number, s: number][] = [
  [0.12, 0.22, -25, 1.12],
  [0.84, 0.17, 20, 0.9],
  [0.91, 0.67, -18, 1.12],
  [0.1, 0.77, 25, 0.92],
  [0.69, 0.89, -15, 0.65],
  [0.49, -0.12, 155, 0.85],
  [-0.12, 0.44, 40, 0.7],
  [1.12, 0.34, -30, 0.8]
];
const mobileHeroPositions: [x: number, y: number][] = [
  [0.16, 0.22],
  [0.86, 0.2],
  [1, 0.72],
  [0.04, 0.81],
  [0.53, 0.94],
  [0.5, -0.2],
  [-0.3, 0.45],
  [1.3, 0.45]
];

export function getPoses(
  index: number,
  count: number,
  isMobile: boolean
): PoseList {
  // The first 8 characters are placed by hand. The rest wait just off screen.
  const base = heroPoses[index % heroPoses.length];
  const hero: Pose =
    index < 8
      ? { x: base[0], y: base[1], r: base[2], s: base[3] }
      : {
          x: index % 2 ? 1.3 : -0.3,
          y: (index - 8) / Math.max(1, count - 8),
          r: index * 37,
          s: 0.6
        };
  if (isMobile && index < 8) {
    hero.x = mobileHeroPositions[index][0];
    hero.y = mobileHeroPositions[index][1];
  }
  // Fly-by: push away from the center. Character 0 zooms in close to the camera.
  const flyBy: Pose = {
    x: 0.5 + (hero.x - 0.5) * 1.7,
    y: 0.5 + (hero.y - 0.5) * 1.6,
    r: hero.r + 100,
    s: index === 0 ? 3.8 : 0.4
  };
  // Orbit: spread evenly around an oval.
  const angle = (index / count) * Math.PI * 2;
  const orbit: Pose = {
    x: 0.5 + Math.cos(angle) * (0.43 + (index % 3) * 0.12),
    y: 0.5 + Math.sin(angle) * (0.43 + (index % 2) * 0.12),
    r: index * 31 - 70,
    s: index % 4 === 0 ? 0.95 : 0.5 + (index % 3) * 0.12
  };
  // Grid: rows and columns that fill the screen.
  const columns = isMobile ? 4 : 6;
  const rows = Math.ceil(count / columns);
  const grid: Pose = {
    x: ((index % columns) + 0.5) / columns,
    y: (Math.floor(index / columns) + 0.5) / rows,
    r: (index % 2 ? 1 : -1) * (12 + (index % 4) * 6),
    s: isMobile ? 1.25 : 1.35
  };
  return [hero, flyBy, orbit, grid, hero];
}

import { gsap } from 'gsap';
import {
  FADES,
  POSE_TIMES,
  getPoses,
  type FadeRange,
  type Pose
} from './keyframes.ts';
import type { Character } from './characters.ts';

export interface PageElements {
  world: HTMLElement;
  spaceBackground: HTMLElement;
  heroText: HTMLElement;
  orbitText: HTMLElement;
  gridText: HTMLElement;
  rings: HTMLElement[];
  blobs: HTMLElement[];
}

const CREAM = '#f6f3e9';
const GREEN = '#dce5c7';
const RING_ANGLES = [-25, 28];

// Turns screen fractions into pixels. These are functions, so ScrollTrigger
// can run them again after a resize (invalidateOnRefresh).
const toTweenValues = (pose: Pose): gsap.TweenVars => ({
  x: () => pose.x * innerWidth,
  y: () => pose.y * innerHeight,
  rotation: pose.r,
  scale: pose.s
});

/** Moves `targets` from `normal` to `during` at range.start, and back to `normal` by range.end. */
function addFade(
  timeline: gsap.core.Timeline,
  targets: gsap.TweenTarget,
  range: FadeRange,
  normal: gsap.TweenVars,
  during: gsap.TweenVars
) {
  timeline
    .set(targets, { ...normal, immediateRender: true }, 0)
    .to(targets, { ...during, duration: range.fade }, range.start)
    .to(targets, { ...normal, duration: range.fade }, range.end - range.fade);
}

/**
 * The whole page as one timeline that is exactly 1 second long, so a time in
 * the timeline is the same number as the scroll progress.
 * Each `set` at time 0 uses immediateRender, so the first frame is correct
 * before the user scrolls.
 */
export function createScrollTimeline(
  characters: Character[],
  isMobile: boolean,
  page: PageElements
): gsap.core.Timeline {
  const timeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'sine.inOut' }
  });

  characters.forEach(({ pose, index }) => {
    const [hero, flyBy, orbit, grid] = getPoses(
      index,
      characters.length,
      isMobile
    );
    timeline.set(
      pose,
      {
        xPercent: -50,
        yPercent: -50,
        ...toTweenValues(hero),
        immediateRender: true
      },
      0
    );
    [flyBy, orbit, grid, hero].forEach((next, i) =>
      timeline.to(
        pose,
        {
          ...toTweenValues(next),
          duration: POSE_TIMES[i + 1] - POSE_TIMES[i]
        },
        POSE_TIMES[i]
      )
    );
  });

  const textHidden = { opacity: 0, y: 55, scale: 0.94 };
  const textShown = { opacity: 1, y: 0, scale: 1 };
  // The hero text is the other way round: shown at both ends of the loop,
  // hidden in the middle.
  addFade(timeline, page.heroText, FADES.heroOut, textShown, {
    opacity: 0,
    y: -65,
    scale: 0.94
  });
  addFade(timeline, page.orbitText, FADES.orbitText, textHidden, textShown);
  addFade(timeline, page.gridText, FADES.gridText, textHidden, textShown);
  addFade(
    timeline,
    page.spaceBackground,
    FADES.space,
    { opacity: 0 },
    { opacity: 1 }
  );
  addFade(timeline, page.blobs, FADES.space, { opacity: 1 }, { opacity: 0 });
  addFade(
    timeline,
    page.rings,
    FADES.space,
    { opacity: 1, scale: 1 },
    { opacity: 0.4, scale: 1.3 }
  );
  addFade(
    timeline,
    page.world,
    FADES.greenBackground,
    { backgroundColor: CREAM },
    { backgroundColor: GREEN }
  );

  // Each ring swings 20° one way and 20° the other way once per loop,
  // like a sine wave.
  page.rings.forEach((ring, i) => {
    const angle = RING_ANGLES[i] ?? 0;
    timeline
      .set(ring, { rotation: angle, immediateRender: true }, 0)
      .to(ring, { rotation: angle + 20, duration: 0.25, ease: 'sine.out' }, 0)
      .to(ring, { rotation: angle, duration: 0.25, ease: 'sine.in' }, 0.25)
      .to(ring, { rotation: angle - 20, duration: 0.25, ease: 'sine.out' }, 0.5)
      .to(ring, { rotation: angle, duration: 0.25, ease: 'sine.in' }, 0.75);
  });
  return timeline;
}

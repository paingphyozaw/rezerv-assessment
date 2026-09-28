import { gsap } from 'gsap';
import type { Character } from './characters.ts';

export interface IdleMotion {
  pause(): void;
  resume(): void;
  /** CTA: every character spins a little and stops. */
  spin(): void;
  /** Mouse position from the center of the screen, from -0.5 to 0.5 on each axis. */
  followMouse(x: number, y: number): void;
}

/** 1 means full movement, 0 means standing still. */
interface Strength {
  value: number;
}
const FULL: Strength = { value: 1 };

// Moves a value back and forth forever, like size · sin(speed · time + offset).
// A yoyo tween between -size and +size with the sine.inOut ease makes exactly
// that curve. Starting it (offset + π/2) / speed seconds in sets the offset.
// Every value is multiplied by strength.value before it is drawn.
function sineLoop(
  target: HTMLElement,
  property: 'x' | 'y' | 'rotation',
  size: number,
  speed: number,
  offset: number,
  strength: Strength = FULL
): gsap.core.Tween {
  return gsap
    .fromTo(
      target,
      { [property]: -size },
      {
        [property]: size,
        duration: Math.PI / speed,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        // GSAP passes values with units ("12px"); unitize removes and re-adds them.
        modifiers: {
          [property]: gsap.utils.unitize((value) => value * strength.value)
        }
      }
    )
    .totalTime((offset + Math.PI / 2) / speed);
}

// A sine wave that gets smaller over time, used as an ease: the spin swings
// past, comes back, and stops at 0.
const fadingWiggle = (p: number) => (1 - p) * Math.sin(p * 7.5);

export function createIdleMotion(
  characters: Character[],
  blobs: HTMLElement[]
): IdleMotion {
  // Pausing fades the characters' movement out, so they drift back to their
  // pose like the original page. Their loops keep running underneath, so each
  // character keeps its own rhythm when the movement fades back in.
  const strength: Strength = { value: 1 };
  characters.forEach(({ float, body, index: i }) => {
    sineLoop(float, 'y', innerHeight * 0.016, 0.62, i * 1.7, strength);
    sineLoop(float, 'x', innerWidth * 0.012, 0.47, i + Math.PI / 2, strength);
    sineLoop(body, 'rotation', 9, 0.5, i, strength);
  });
  const setStrength = (value: number) =>
    gsap.to(strength, {
      value,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: true
    });
  // Blobs just freeze where they are when paused.
  const blobLoops: gsap.core.Tween[] = [];
  blobs.forEach((blob, i) => {
    blobLoops.push(
      sineLoop(blob, 'x', 40, 0.2, i),
      sineLoop(blob, 'y', 55, 0.3, i + Math.PI / 2),
      gsap.to(blob, {
        rotation: i ? 360 : -360,
        duration: 180,
        ease: 'none',
        repeat: -1
      })
    );
  });

  const moveX = characters.map((c) =>
    gsap.quickTo(c.element, 'x', { duration: 0.4, ease: 'power2.out' })
  );
  const moveY = characters.map((c) =>
    gsap.quickTo(c.element, 'y', { duration: 0.4, ease: 'power2.out' })
  );

  const idle: IdleMotion = {
    pause() {
      setStrength(0);
      blobLoops.forEach((loop) => loop.pause());
      idle.followMouse(0, 0);
    },
    resume() {
      setStrength(1);
      blobLoops.forEach((loop) => loop.resume());
    },
    spin() {
      characters.forEach(({ spin, index }) =>
        gsap.fromTo(
          spin,
          { rotation: 0 },
          {
            rotation: index % 2 ? -28 : 28,
            duration: 1.25,
            ease: fadingWiggle,
            overwrite: true
          }
        )
      );
    },
    followMouse(x, y) {
      characters.forEach(({ index }, i) => {
        const distance = 8 + (index % 4) * 4;
        moveX[i](x * distance);
        moveY[i](y * distance);
      });
    }
  };
  return idle;
}

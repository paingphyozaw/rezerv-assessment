# Little Orbit

An endlessly scrolling illustrated world. It takes the feel of the [Fluffy HUGS](https://nft.fluffyhugs.io/) reference page and uses its own SVG fruit characters. One page: no routing, working CTAs, external media, or backend.

- **Live site:** https://part-1-ui-animation-challenge.vercel.app/
- **Repository:** [paingphyozaw/rezerv-assessment](https://github.com/paingphyozaw/rezerv-assessment) (this folder)

## Setup

Requires Node 22.18+ (Vite 8, and Node runs the TypeScript tests directly).

```sh
cd part-1-ui-animation-challenge
npm install
npm run dev        # http://127.0.0.1:4173
npm run typecheck  # tsc, strict mode
npm test           # motion contract tests (node:test)
npm run build      # typecheck, then production build to dist/
npm run preview    # serve dist/
```

## Implemented slides

The brief asks for 3 of the reference's sections. This page follows the recommended set:

1. **Loading screen.** A walking character and a progress track. It is followed by an entrance reveal: the loader lifts and the hero heading rises in.
2. **Hero.** An oversized headline surrounded by floating characters. As you scroll, one character flies past at close range.
3. **Collection.** A full-screen collage of the whole cast on a green field.

An orbital space scene sits between the hero and the collection. It carries the characters from the scattered hero layout to the collage grid. After the collection, scrolling flows back into the hero, and you can scroll forward or backward forever.

## Interactions

| Moment | Behavior |
|---|---|
| Load | Loader waits for font readiness, then plays the entrance reveal. |
| Scroll | Scroll-scrubbed translate, rotate, scale, and fade for characters and copy; backdrop and rings fade between scenes; the page is pinned and the timeline loops. |
| Hover | Characters grow, tilt, and wave their limbs under the mouse. The header button and CTA have their own hover states. Mouse position adds parallax depth. |
| Resize | Timeline phase is kept. Crossing the 600px breakpoint fades the cast out, swaps between the 24- and 16-character layouts, and fades back in, so no character jumps. |
| Controls | The header button pauses ambient motion. The bottom-right CTA spins the cast and does not navigate. |

## Libraries and why

- **TypeScript** (strict) for the pose model and runtime. A `PoseCycle` tuple type enforces exactly five poses per character, which is what keeps the loop seamless.
- **Vite** for dev server and build.
- **Tailwind v4** meets the CSS framework requirement. It handles reset and layout utilities. Most visuals are component CSS in `src/style.css`, because every animated value is written by the frame loop, not by class changes.
- **No GSAP, ScrollTrigger, or Lenis.** The whole page is one periodic timeline computed by pure functions in `src/motion.ts`. An infinite loop needs native scroll rebasing (below). Smooth-scroll libraries replace native scrolling with a virtual scroller, and ScrollTrigger timelines are finite, so both would fight that loop. Without them the JS bundle is about 4 kB gzipped.

## Approach

**Animation.** `motion.ts` gives each character five poses: hero, fly-by, orbit, collage, and hero again. The first and last poses are identical, so the loop seam is continuous. `poseAt(poses, phase)` eases between them. Scene copy uses opacity windows over the same phase. `main.ts` runs one `requestAnimationFrame` loop that writes only `transform` and `opacity`.

**Smooth scroll.** Native scrolling drives an unbounded timeline. The scroll track is three cycles tall. Near either end, the page is repositioned into the middle cycle at the same visual phase, so no scene restarts and wheel, touch, and keyboard input all keep working. Frame-rate-independent exponential damping smooths the result.

**Responsiveness.** Desktop is above 1000px, tablet is 600–1000px, and mobile is below 600px, plus a short-landscape rule. Character size and choreography are measured together in JS on resize (rAF-throttled). Typography and chrome use CSS breakpoints.

## Project structure

| File | Role |
|---|---|
| `src/art.ts` | Original SVG characters and character data |
| `src/motion.ts` | Pure, periodic pose interpolation and opacity windows |
| `src/main.ts` | Scene setup, the single frame loop, scroll rebasing, resize handling, controls |
| `src/style.css` | Visual system, breakpoints, hover states, reduced-motion fallback |
| `src/motion.test.ts` | Loop-seam, rebasing, and opacity contract tests |

## Performance notes

- Only `transform` and `opacity` animate. The exception is the background color of a single full-viewport layer, which changes between scenes.
- Geometry is measured on resize, never inside the frame loop, so there is no layout read/write alternation during animation.
- 24 characters on desktop and tablet, 16 on mobile. No video, images, font requests, or animation library.
- The frame loop stops in hidden tabs. Pause freezes ambient motion and removes scroll damping.
- `prefers-reduced-motion` switches live to a finite, static page with all three sections and a four-character gallery.
- Inactive animated copy is hidden from assistive technology. Controls have accessible labels and focus indicators.

## Assumptions

- Original artwork is acceptable in place of the reference NFT art, as the brief allows.
- "Match the feel" means matching the choreography and continuity, not frame-exact timing.
- The loading screen counts as one of the three sections, as the brief's recommended set suggests. The orbit scene is an extra transition.
- All artwork is inline SVG and fonts are system fonts, so there is no heavy media to lazy-load. The loader covers font readiness.
- Graceful degradation on lower-powered devices means fewer characters on mobile, a pause control, and the reduced-motion fallback.
- CTAs give visual feedback only and do not navigate.

## Verification

- `npm test`: three contract tests cover loop-seam continuity (forward and backward), scroll rebasing, and opacity bounds.
- `npm run typecheck` and `npm run build` succeed.
- Not yet measured: real-device frame rate, CPU-throttled profiling, OS-level reduced-motion, and slow-network loading. 60fps is a target, not a measured result.

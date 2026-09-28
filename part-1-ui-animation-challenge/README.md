# Little Orbit

An endlessly scrolling illustrated world. It takes the feel of the [Fluffy HUGS](https://nft.fluffyhugs.io/) reference page and uses its own SVG fruit characters. One page: no routing, working CTAs, external media, or backend.

The motion is built on Locomotive Scroll, a GSAP timeline, and ScrollTrigger. An earlier version with hand-written scroll and animation code is in the git history (commit `6a2c96c`); this version looks and moves the same.

- **Live site:** https://part-1-ui-animation-challenge.vercel.app/
- **Repository:** [paingphyozaw/rezerv-assessment](https://github.com/paingphyozaw/rezerv-assessment) (this folder)

## Setup

Requires Node 22.18+ (Vite 8, and Node runs the TypeScript tests directly).

```sh
cd part-1-ui-animation-challenge
npm install
npm run dev        # http://127.0.0.1:4173
npm run typecheck  # tsc, strict mode
npm test           # keyframe and keyboard tests (node:test)
npm run build      # typecheck, then production build to dist/
npm run preview    # serve dist/
```

## Implemented slides

The brief asks for 3 of the reference's sections. This page follows the recommended set:

1. **Loading screen.** A walking character and a progress track. It is followed by an entrance reveal: the loader lifts and the hero heading rises in.
2. **Hero.** An oversized headline surrounded by floating characters. As you scroll, one character flies past at close range.
3. **Collection.** A full-screen grid of the whole cast on a green background.

An orbital space scene sits between the hero and the collection. It carries the characters from the scattered hero layout to the grid. After the collection, scrolling flows back into the hero, and you can scroll forward or backward forever.

## Interactions

| Moment | Behavior |
|---|---|
| Load | Loader waits for font readiness, then plays the entrance reveal. |
| Scroll | A scroll-scrubbed timeline moves, rotates, scales, and fades the characters and text; the space background and rings fade between scenes. The page stays fixed on screen while you scroll, and the loop never ends — with the wheel, touch, or the keyboard. |
| Hover | Characters grow, tilt, and wave their limbs under the mouse. The header button and CTA have their own hover states. Mouse position adds parallax depth. |
| Resize | The timeline re-measures and the reader stays at the same phase. Crossing 600px rebuilds the cast (24 ↔ 16 characters) and fades it in. |
| Keyboard | Arrow keys, Page Up/Down, and Space scroll through Lenis, so they loop too. Space on a focused button presses the button. |
| Controls | The header button pauses the floating motion; characters ease back to their pose. The bottom-right CTA spins the cast and does not navigate. |

## Libraries and why

- **Locomotive Scroll v5** for smooth, infinite scrolling. v5 is built on Lenis. Its setup is one statement, and `lenisOptions: { infinite: true }` passes Lenis's infinite mode through. Locomotive's own extras (`data-scroll` parallax, in-view detection) are for pages whose sections scroll past; this page is one scene fixed to the screen, so they are unused. It renders on GSAP's ticker through `initCustomTicker`, so there is one frame loop.
- **GSAP timeline** for the scroll animation. The whole page is one timeline exactly one second long, so every time in it equals a scroll progress (0.23 = fly-by reached).
- **ScrollTrigger with `scrub: true`** to connect scroll progress to the timeline. Before building, a spike scrolled across the loop seam in both directions:

  | Wiring | Seam | Timeline vs scroll gap |
  |---|---|---|
  | `scrub: true` | Seamless | ≤ 0.001 |
  | `scrub: 1` | Rewinds through the middle of the timeline after each wrap | up to 0.87 |

  Lenis already smooths the scroll. A numeric scrub adds a second smoothing layer, and that layer chases the wrap from 1 back to 0 by playing the timeline in reverse.
- **No Framer Motion.** It targets React. This page is vanilla TypeScript, and one animation library is enough.
- **SCSS** (Sass) meets the styling requirement. An earlier version used Tailwind v4, but only two elements used its utility classes; everything else was hand-written CSS. One styling system is simpler to read than two, so the page now uses SCSS only. SCSS adds one file per part of the page, mixins so every screen size is written the same way, and shared variables for colors, easing, and screen sizes.
- **Vite** for the dev server and build. **TypeScript** (strict) throughout.

## Approach

**Animation.** `keyframes.ts` holds the data: five poses per character (hero, fly-by, orbit, grid, hero again) and when each scene fades in and out. `scroll-timeline.ts` turns that data into GSAP tweens. Pose positions are viewport fractions, converted to pixels by function-based values that ScrollTrigger re-runs on resize (`invalidateOnRefresh`).

**One layer per motion.** Each character is five nested elements, and each GSAP tween owns one of them, so no two tweens write the same property:

```
character               follows the mouse   (gsap.quickTo x/y)
 └ __float               floats and sways    (yoyo sine tweens)
   └ __pose              scroll position     (scroll timeline: x, y, rotation, scale)
     └ __spin            CTA spin            (fading-wiggle ease)
       └ __body          wobble (GSAP)
         └ __art (SVG)   grows and tilts on hover (CSS)
```

The mouse and float layers sit outside the pose layer, so they move in screen space and are not scaled by the fly-by's 3.8× zoom. The hover is on `__art` because GSAP writes inline styles on `__body`, and inline styles would override the hover rule.

**Idle motion.** A yoyo tween between ±size with `sine.inOut` is exactly `size · sin(speed · t + offset)`. Each float, sway, and wobble keeps the speed and offset of the original hand-written sine. Pausing tweens a `strength` value from 1 to 0 that multiplies every movement, so characters ease back to their pose and keep their own rhythm when they start again.

**Smooth scroll.** Locomotive (Lenis) handles wheel and touch input with `infinite: true` and `syncTouch: true`. Lenis only loops its own input, so scroll keys are sent through `lenis.scrollTo(…, { programmatic: false })` as well. The scroll track is six screens tall, so one loop is five screens of scrolling.

**Responsiveness.** `gsap.matchMedia()` watches `(max-width: 600px)` and `prefers-reduced-motion`. When either changes, GSAP reverts every tween and ScrollTrigger from the previous setup and the page rebuilds. ScrollTrigger scrolls to the top while it measures, so the current phase is saved before each refresh and restored after.

## Project structure

| File | Role |
|---|---|
| `src/art.ts` | Original SVG characters and character data |
| `src/keyframes.ts` | Plain data: poses, pose times, fades, scene start points |
| `src/characters.ts` | Builds the five-layer HTML for each character |
| `src/scroll-timeline.ts` | Builds the one-second scroll timeline from the keyframes |
| `src/idle-motion.ts` | Floating, sway, wobble, blobs, mouse follow, CTA spin, pause |
| `src/keyboard.ts` | How far each scroll key moves the page |
| `src/main.ts` | Loader, Locomotive + ScrollTrigger setup, `matchMedia`, scene labels, controls |
| `src/styles/` | SCSS: settings, reset, and one file per part of the page (see CSS architecture) |
| `src/keyframes.test.ts` | Every loop joins up, pose times, fades, scene start points |
| `src/keyboard.test.ts` | Scroll distance for each key, Space on buttons |

## CSS architecture

Styles are SCSS in `src/styles/`, one file per part of the page:

```
src/styles/
├── main.scss             loads the files below, in this order
├── _settings.scss        colors, easing, screen sizes, mixins
├── _base.scss            browser reset (in @layer), page defaults, world, scroll track
├── _interface.scss       loader, header, logo, pause button, bottom bar, scene counter, spin button
├── _scenes.scss          the big text of each scene
├── _characters.scss      the five character layers and the hover
├── _background.scss      space, stars, planets, rings, blobs
└── _reduced-motion.scss  pause, the reduced-motion page, and its gallery
```

- **Class names** use BEM: `block`, `block__part`, `block--variant`. For example `scene`, `scene__title`, `scene--grid`. Parts are never chained (`character__art`, not `character__pose__spin__art`), so markup can move without renaming.
- **States** set by JavaScript start with `is-`: `is-ready`, `is-paused`, `is-in-space`, `is-reduced-motion`, `is-active`.
- **Screen sizes** use mixins (`media-tablet`, `media-mobile`, `media-short-landscape`, `media-mouse`). Each section lists its normal styles first, then tablet, then mobile, then short landscape, so the smaller screen always wins.
- **Element selectors** appear only in the reset, the page defaults, and for the unnamed shapes inside the SVG art.

The switch from Tailwind to SCSS was checked by loading the old and new builds side by side and comparing every computed style of every element (about 300,000 values per size) at 1280×800, 820×1000, 390×844, 900×500, and 600×500, plus the reduced-motion page. No values differed. Hover and active rules, which computed styles cannot show, have the same declarations.

## Performance notes

- Only `transform` and `opacity` animate, plus the background color of the single full-viewport `.world` layer.
- One frame loop: GSAP's ticker drives GSAP and Locomotive. It runs on `requestAnimationFrame`, so it stops in hidden tabs.
- Scene labels (counter, hint text, `aria-hidden`, light header in space) are written only when they change.
- 24 characters on desktop and tablet, 16 on mobile. No video, images, or font requests.
- On touch devices ScrollTrigger ignores height-only resizes (the mobile address bar showing and hiding), so the page does not re-measure while you scroll.
- The JS bundle is about 57 kB gzipped, mostly GSAP and ScrollTrigger. The earlier hand-written version was about 4 kB.
- `prefers-reduced-motion` switches live to a finite, static page with all three sections and a four-character gallery.

## Assumptions

- Original artwork is acceptable in place of the reference NFT art, as the brief allows.
- "Match the feel" means matching the movement and flow, not frame-exact timing.
- The loading screen counts as one of the three sections, as the brief's recommended set suggests. The orbit scene is an extra transition.
- All artwork is inline SVG and fonts are system fonts, so there is no heavy media to lazy-load. The loader covers font readiness.
- Graceful degradation on lower-powered devices means fewer characters on mobile, a pause control, and the reduced-motion fallback.
- CTAs give visual feedback only and do not navigate.

## Differences from the earlier hand-written version

1. Crossing 600px swaps the cast and fades it in; the earlier version also faded it out first.
2. In the space scene, the earlier version added a small circle and an extra ±15° sway to each character. Both are removed here. Float and sway continue in every scene.
3. Pause eases the characters back to their pose instead of snapping, and keeps scroll smoothing on.
4. Pose easing is `sine.inOut` instead of smoothstep; the curves are close.
5. The floating distance is measured when the page is built, so a resize that does not cross 600px keeps the old distance (at most a few pixels).

## Verification

- `npm test`: nine tests cover every character's loop, pose times, fades, scene and space start points at and around each boundary, and the scroll distance of each key.
- `npm run typecheck` and `npm run build` succeed.
- Browser checks (1280×800 and 500×800, automated wheel and key input): the seam is crossed forward and backward with no rewind, by wheel and by Page Up/Down; scenes switch at the expected progress; the first frame matches the keyframes exactly; pause eases characters to their pose and resume keeps each one's rhythm; the CTA spins and stops; crossing 600px rebuilds to 16 or 24 characters and keeps the phase; a desktop height resize keeps the phase.
- Not yet measured: real-device frame rate, CPU-throttled profiling, iPhone touch scrolling across the seam, and a live OS reduced-motion toggle.

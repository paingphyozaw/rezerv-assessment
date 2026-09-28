# Little Orbit

A one-page scrolling world with fruit characters, based on the feel of the [Fluffy HUGS](https://nft.fluffyhugs.io/) page. The artwork is my own SVG. There is no routing, backend, or external media.

- **Live site:** https://part-1-ui-animation-challenge.vercel.app/
- **Repository:** [paingphyozaw/rezerv-assessment](https://github.com/paingphyozaw/rezerv-assessment) (this folder)

## Setup

Needs Node 22.18 or newer.

```sh
cd part-1-ui-animation-challenge
npm install
npm run dev        # http://127.0.0.1:4173
npm test           # unit tests
npm run build      # type check + production build
```

## The 3 sections

1. **Loading screen.** A walking character and a loading bar. Then the screen slides up and the hero title rises in.
2. **Hero.** A big headline with characters floating around it. When you scroll, one character flies past, very close.
3. **Collection.** All the characters in a grid on a green background.

A space scene sits between the hero and the collection. After the collection the page loops back to the hero, so you can scroll forever, up or down.

## What moves

| When | What happens |
|---|---|
| Page loads | Loading screen, then the hero appears. |
| Scroll | Characters move, turn, grow, and shrink. Text and backgrounds fade in and out. The loop never ends (mouse wheel, touch, or keyboard). |
| Mouse | Characters follow the mouse a little. Hovering a character makes it grow, tilt, and wave. Buttons change on hover. |
| Resize | The page stays in the same scene. Below 600px it uses 16 characters instead of 24. |
| Buttons | Top-right pauses the floating motion. Bottom-right makes all characters spin. Neither goes to another page. |

## Libraries and why

- **Locomotive Scroll** for smooth scrolling. Its `infinite` option (from Lenis, which it is built on) makes the page loop forever.
- **GSAP + ScrollTrigger** for the animation. The whole page is one GSAP timeline, and ScrollTrigger plays it as you scroll. I use `scrub: true`: a numeric value like `scrub: 1` made the timeline play backwards every time the loop jumped from the end to the start.
- **SCSS** for styles, split into one file per part of the page.
- **Vite** and **TypeScript**.
- I did not use Framer Motion, because it is made for React and this page has no framework.

## How it works

**Animation.** Each character has 5 poses: hero, fly-by, orbit, grid, and hero again. They live in `keyframes.ts`. `scroll-timeline.ts` turns them into one GSAP timeline that is exactly 1 second long, so a time in the timeline is the same as the scroll progress (0 to 1).

**Five layers per character.** Each moving part has its own element, so animations never fight over the same property:

```
character          follows the mouse
 └ __float          floats up, down, and sideways
   └ __pose         position, turn, and size from the scroll
     └ __spin       spin from the bottom-right button
       └ __body     wobble
         └ __art    the SVG; grows and tilts on hover (CSS)
```

**Smooth, endless scroll.** Locomotive Scroll handles the wheel and touch. Arrow keys, Page Up/Down, and Space are sent through it too, so they loop as well.

**Responsive.** `gsap.matchMedia()` rebuilds the animation when the screen crosses 600px or the reduced-motion setting changes. The scroll position is saved and restored, so you stay in the same scene.

## Project structure

| File | What it does |
|---|---|
| `src/main.ts` | Starts everything: loading screen, scroll, buttons, scene counter |
| `src/keyframes.ts` | Character poses and scene timings (plain data) |
| `src/scroll-timeline.ts` | Builds the scroll timeline |
| `src/idle-motion.ts` | Floating, mouse follow, spin, and pause |
| `src/characters.ts` | Builds the HTML for each character |
| `src/keyboard.ts` | How far each key scrolls |
| `src/art.ts` | The SVG fruit characters |
| `src/styles/` | SCSS: settings, base, interface, scenes, characters, background, reduced motion |
| `src/*.test.ts` | Tests for the keyframes and keyboard |

Class names use BEM (`scene`, `scene__title`, `scene--grid`). States set by JavaScript start with `is-` (`is-paused`, `is-active`).

## Performance

- Only `transform` and `opacity` animate (plus one background color), so the browser does not redo the layout while scrolling.
- One animation loop drives both GSAP and the scrolling, and it stops when the tab is hidden.
- Mobile uses 16 characters instead of 24. There are no images, videos, or web fonts to load.
- With reduced motion turned on in the OS, the page becomes a normal static page.
- The JavaScript is about 57 kB gzipped, mostly GSAP.

## Assumptions

- My own artwork is fine instead of the reference NFT art, as the brief allows.
- "Match the feel" means the same kind of movement, not frame-exact timing.
- The loading screen counts as one of the 3 sections.
- There is no heavy media, so nothing needs lazy loading.
- The buttons only animate; they do not navigate.

## Testing

- `npm test` runs 9 unit tests.
- I checked in the browser: looping in both directions, scene changes, pause, the spin button, and resizing across 600px.
- Not yet tested on a real phone or with CPU throttling.

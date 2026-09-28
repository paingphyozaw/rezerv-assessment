import './styles/main.scss';
import 'locomotive-scroll/locomotive-scroll.css';
import LocomotiveScroll from 'locomotive-scroll';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fruit, friends } from './art.ts';
import { createCharacters } from './characters.ts';
import { createIdleMotion, type IdleMotion } from './idle-motion.ts';
import { keyScrollDistance } from './keyboard.ts';
import { getScene, isInSpace, type SceneNumber } from './keyframes.ts';
import { createScrollTimeline, type PageElements } from './scroll-timeline.ts';

gsap.registerPlugin(ScrollTrigger);

// The HTML never changes, so a missing element is a bug. Fail loudly.
function $<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
const $$ = <T extends Element = HTMLElement>(selector: string): T[] => [
  ...document.querySelectorAll<T>(selector)
];

const page: PageElements = {
  world: $('.world'),
  spaceBackground: $('.space'),
  heroText: $('.scene--hero'),
  orbitText: $('.scene--orbit'),
  gridText: $('.scene--grid'),
  rings: $$('.ring'),
  blobs: $$('.blob')
};
const characterLayer = $('.characters');
const scenes = $$('.scene');
const sceneDots = $$('.scene-counter__dot');
const sceneCounter = $('.scene-counter');
const sceneNumber = $('.scene-counter__number');
const scrollHint = $('.bottom-bar__hint');
const pauseButton = $<HTMLButtonElement>('.pause-button');
const pauseIcon = $('.pause-button__icon');

$('.loader__character').innerHTML = fruit('pear', 1);
$('.gallery').innerHTML = friends
  .map(
    (f, i) =>
      `<article class="gallery__card" style="--color-card:${f.color}">${fruit(f.kind, i, 'gallery__art')}<h3 class="gallery__name">${f.name}</h3><p class="gallery__note">${f.note}</p></article>`
  )
  .join('');
$('.space__stars').innerHTML = Array.from(
  { length: 35 },
  (_, i) =>
    `<i class="space__star" style="left:${(i * 47) % 100}%;top:${(i * 31) % 100}%;scale:${0.4 + (i % 4) * 0.25}">✧</i>`
).join('');

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const SCROLL_HINTS = [
  'SCROLL TO GET A LITTLE LOST',
  'SCROLL TO GET A LITTLE LOST',
  'KEEP GOING. GOOD THINGS COME AROUND.'
];
let shownScene: SceneNumber | -1 = -1;
let shownInSpace = false;
let currentProgress = 0;
let hasBuiltOnce = false;
let isPaused = false;
let idleMotion: IdleMotion | null = null;

// Updates the scene counter, labels and header color. Only touches the DOM
// when something actually changed.
function updateSceneLabels(progress: number) {
  currentProgress = progress;
  const scene = getScene(progress);
  if (scene !== shownScene) {
    shownScene = scene;
    scenes.forEach((el, i) =>
      el.setAttribute('aria-hidden', String(i !== scene))
    );
    sceneDots.forEach((dot, i) => dot.classList.toggle('is-active', i === scene));
    sceneCounter.setAttribute('aria-label', `Scene ${scene + 1} of 3`);
    sceneNumber.textContent = `0${scene + 1} — 03`;
    scrollHint.textContent = SCROLL_HINTS[scene];
  }
  const inSpace = isInSpace(progress);
  if (inSpace !== shownInSpace) {
    shownInSpace = inSpace;
    document.body.classList.toggle('is-in-space', inSpace);
  }
}

function showStaticPage() {
  document.body.classList.add('is-reduced-motion');
  document.body.classList.remove('is-in-space');
  scenes.forEach((scene) => scene.removeAttribute('aria-hidden'));
  window.scrollTo(0, 0);
}

/** Builds every animation. Returns a function that removes what GSAP does not clean up itself. */
function startAnimations(isMobile: boolean): () => void {
  document.body.classList.remove('is-reduced-motion');
  const characters = createCharacters(characterLayer, isMobile ? 16 : 24);
  const timeline = createScrollTimeline(characters, isMobile, page);

  // Locomotive Scroll uses Lenis for smooth scrolling that loops forever.
  // It runs on GSAP's ticker, so there is only one animation loop.
  const smoothScroll = new LocomotiveScroll({
    lenisOptions: { infinite: true, syncTouch: true },
    scrollCallback: () => ScrollTrigger.update(),
    initCustomTicker: (render) => gsap.ticker.add(render),
    destroyCustomTicker: (render) => gsap.ticker.remove(render)
  });
  const lenis = smoothScroll.lenisInstance;
  const scrollToProgress = (progress: number) => {
    lenis?.resize();
    lenis?.scrollTo(progress * ScrollTrigger.maxScroll(window), {
      immediate: true
    });
  };

  // scrub: true (not a number). Lenis already smooths the scroll. A number
  // would smooth it again and play the whole timeline backwards each time
  // the loop jumps from the end to the start.
  shownScene = -1;
  shownInSpace = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    scrub: true,
    animation: timeline,
    invalidateOnRefresh: true,
    onUpdate: (self) => updateSceneLabels(self.progress)
  });

  idleMotion = createIdleMotion(characters, page.blobs);
  if (isPaused) idleMotion.pause();
  const onMouseMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || isPaused) return;
    idleMotion?.followMouse(
      event.clientX / innerWidth - 0.5,
      event.clientY / innerHeight - 0.5
    );
  };
  const onMouseLeave = () => idleMotion?.followMouse(0, 0);
  page.world.addEventListener('pointermove', onMouseMove, { passive: true });
  page.world.addEventListener('pointerleave', onMouseLeave);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const distance = keyScrollDistance(event.key, {
      shift: event.shiftKey,
      onButton: event.target instanceof HTMLButtonElement,
      pageHeight: innerHeight
    });
    if (distance === null || !lenis) return;
    event.preventDefault();
    // programmatic: false lets Lenis treat it like a scroll wheel, so it loops.
    lenis.scrollTo(lenis.targetScroll + distance, { programmatic: false });
  };
  window.addEventListener('keydown', onKeyDown);

  // ScrollTrigger jumps to the top while it measures the page (after a
  // resize or a rebuild). Save the progress before that and go back after.
  // A new ScrollTrigger reports 0 until it is measured, so the progress is
  // kept in `currentProgress`, which lives outside this function.
  let savedProgress = currentProgress;
  const saveProgress = () => (savedProgress = currentProgress);
  const restoreProgress = () => scrollToProgress(savedProgress);
  ScrollTrigger.addEventListener('refreshInit', saveProgress);
  ScrollTrigger.addEventListener('refresh', restoreProgress);

  if (hasBuiltOnce) {
    scrollToProgress(savedProgress);
    gsap.from(characterLayer, { opacity: 0, duration: 0.35 });
  }
  hasBuiltOnce = true;
  updateSceneLabels(savedProgress);

  return () => {
    ScrollTrigger.removeEventListener('refreshInit', saveProgress);
    ScrollTrigger.removeEventListener('refresh', restoreProgress);
    page.world.removeEventListener('pointermove', onMouseMove);
    page.world.removeEventListener('pointerleave', onMouseLeave);
    window.removeEventListener('keydown', onKeyDown);
    idleMotion = null;
    smoothScroll.destroy();
  };
}

pauseButton.addEventListener('click', () => {
  isPaused = !isPaused;
  document.body.classList.toggle('is-paused', isPaused);
  pauseButton.setAttribute('aria-pressed', String(isPaused));
  pauseButton.setAttribute(
    'aria-label',
    isPaused ? 'Resume animation' : 'Pause animation'
  );
  pauseIcon.textContent = isPaused ? '▷' : 'Ⅱ';
  if (isPaused) idleMotion?.pause();
  else idleMotion?.resume();
});
$('.spin-button').addEventListener('click', () => {
  if (!isPaused) idleMotion?.spin();
});

async function hideLoader() {
  const reducedMotion = matchMedia(REDUCED_MOTION).matches;
  document.body.classList.toggle('is-reduced-motion', reducedMotion);
  await document.fonts.ready;
  if (!reducedMotion) await new Promise((resolve) => setTimeout(resolve, 1000));
  document.body.classList.add('is-ready');
  $('.loader').setAttribute('aria-hidden', 'true');
}

// gsap.matchMedia rebuilds everything when the screen crosses 600px or the
// reduced-motion setting changes. One of `reduce` and `motion` always
// matches, so the function below always runs.
function setupAnimations() {
  gsap.matchMedia().add(
    {
      isMobile: '(max-width: 600px)',
      reduce: REDUCED_MOTION,
      motion: '(prefers-reduced-motion: no-preference)'
    },
    (context) => {
      const { isMobile, reduce } = context.conditions as {
        isMobile: boolean;
        reduce: boolean;
      };
      if (reduce) return showStaticPage();
      return startAnimations(isMobile);
    }
  );
}

hideLoader().then(setupAnimations);

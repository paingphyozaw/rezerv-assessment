import './style.css';
import { fruit, friends } from './art.ts';
import {
  modulo,
  mix,
  windowOpacity,
  posesFor,
  poseAt,
  type PoseCycle
} from './motion.ts';

interface Sprite {
  element: HTMLElement;
  index: number;
  poses: PoseCycle;
}

// The page markup is static, so a missing element is a bug worth failing loudly on.
function $<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
const $$ = <T extends Element = HTMLElement>(selector: string): T[] => [
  ...document.querySelectorAll<T>(selector)
];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const world = $('.world'),
  field = $('.fruit-field'),
  track = $('.scroll-track');
const scenes = $$('.scene');
const dots = $$('.scene-indicator i');
const backdrop = $('.space-backdrop');
const rings = $$('.orbit-ring');
const blobs = $$('.blob');
const toggle = $<HTMLButtonElement>('.motion-toggle');
const toggleIcon = $('.motion-toggle span');
const label = $('.scroll-label');
$('.loader-friend').innerHTML = fruit('pear', 1);
$('.static-friends').innerHTML = friends
  .map(
    (f, i) =>
      `<article style="--card-color:${f.color}">${fruit(f.kind, i)}<h3>${f.name}</h3><p>${f.note}</p></article>`
  )
  .join('');
$('.star-field').innerHTML = Array.from(
  { length: 35 },
  (_, i) =>
    `<i style="left:${(i * 47) % 100}%;top:${(i * 31) % 100}%;scale:${0.4 + (i % 4) * 0.25}">✧</i>`
).join('');
let sprites: Sprite[] = [],
  width = innerWidth,
  height = innerHeight,
  cycle = height * 5;
let target = 0,
  current = 0,
  lastY = 0,
  frame = 0,
  lastTime = 0,
  elapsed = 0;
let paused = false,
  ready = false,
  activeScene = -1,
  pointerX = 0,
  pointerY = 0,
  px = 0,
  py = 0;
let burst = 0,
  resizeFrame = 0,
  swapTimer = 0,
  compact: boolean | null = null,
  size = 0;
const isStatic = () => reducedMotion.matches;
const isCompact = () => width < 600;

function createSprites(count: number, mobile: boolean) {
  field.innerHTML = Array.from(
    { length: count },
    (_, i) =>
      `<div class="floater"><div class="fruit-body">${fruit(friends[i % 4].kind, i)}</div></div>`
  ).join('');
  sprites = [...field.children].map((element, index) => ({
    element: element as HTMLElement,
    index,
    poses: posesFor(index, count, mobile)
  }));
}
// Cast size and choreography change together, only when the compact layout flips.
function applyLayout() {
  compact = isCompact();
  createSprites(compact ? 16 : 24, compact);
}
function resizeSprites() {
  size = compact
    ? width * 0.38
    : height <= 550
      ? width * 0.18
      : Math.min(width * 0.19, 290);
  field.style.setProperty('--floater-size', `${size}px`);
}
// Crossing the breakpoint fades the cast out, swaps it, and fades it back in,
// so characters never pop between the 24- and 16-character layouts.
function swapLayout() {
  if (swapTimer) return;
  field.classList.add('is-swapping');
  swapTimer = window.setTimeout(() => {
    swapTimer = 0;
    if (compact !== isCompact()) {
      applyLayout();
      resizeSprites();
    }
    field.classList.remove('is-swapping');
    wake();
  }, 280);
}
function measure() {
  resizeFrame = 0;
  const oldCycle = cycle;
  width = innerWidth;
  height = innerHeight;
  cycle = height * 5;
  if (compact !== isCompact()) {
    if (ready && !isStatic() && sprites.length) swapLayout();
    else applyLayout();
  }
  resizeSprites();
  // Preserve timeline phase when the viewport or orientation changes.
  target = (target / oldCycle) * cycle;
  current = (current / oldCycle) * cycle;
  document.body.classList.toggle('reduced-motion', isStatic());
  if (!isStatic()) {
    track.style.height = `${cycle * 3 + height}px`;
    lastY = cycle + modulo(target, cycle);
    window.scrollTo({ top: lastY, behavior: 'instant' });
  } else {
    track.style.height = '0px';
    document.body.classList.remove('in-space');
    window.scrollTo({ top: 0, behavior: 'instant' });
    scenes.forEach((scene) => {
      scene.removeAttribute('aria-hidden');
      scene.style.opacity = '1';
      scene.style.transform = 'none';
    });
  }
  wake();
}
function onScroll() {
  if (isStatic()) return;
  const y = scrollY;
  target += y - lastY;
  lastY = y;
  // Native scrolling is retained. Rebase in identical neighboring cycles, so
  // wheel, touch, keyboard and reverse scrolling never reach a visual endpoint.
  if (y < cycle * 0.5 || y > cycle * 2.5) {
    const normalized = cycle + modulo(y, cycle);
    lastY = normalized;
    window.scrollTo({ top: normalized, behavior: 'instant' });
  }
  wake();
}
function wake() {
  if (!frame && ready && !document.hidden && !isStatic())
    frame = requestAnimationFrame(render);
}
function render(now: number) {
  frame = 0;
  const dt = Math.min((now - (lastTime || now)) / 1000, 0.05);
  lastTime = now;
  if (!paused) elapsed += dt;
  // Frame-rate-independent damping; input changes are smoothed, not throttled.
  current = paused ? target : mix(current, target, 1 - Math.exp(-dt * 9));
  if (Math.abs(target - current) < 0.05) current = target;
  px = mix(px, pointerX, 1 - Math.exp(-dt * 4));
  py = mix(py, pointerY, 1 - Math.exp(-dt * 4));
  burst = Math.max(0, burst - dt * 0.8);
  const phase = modulo(current / cycle);
  const space = windowOpacity(phase, 0.22, 0.65, 0.13);
  const collage = windowOpacity(phase, 0.52, 0.92, 0.13);
  backdrop.style.opacity = String(space);
  const cream = [246, 243, 233],
    green = [220, 229, 199];
  // Only a single full-viewport layer changes color; all objects use transforms.
  world.style.backgroundColor = `rgb(${cream.map((c, i) => Math.round(mix(c, green[i], collage))).join(',')})`;
  sprites.forEach(({ element, poses, index }) => {
    const pose = poseAt(poses, phase);
    const drift = paused
      ? 0
      : Math.sin(elapsed * 0.62 + index * 1.7) * height * 0.016;
    const sway = paused ? 0 : Math.cos(elapsed * 0.47 + index) * width * 0.012;
    const orbitAngle = elapsed * 0.09 + index * 0.8;
    const orbital = space * (paused ? 0 : 1);
    const x =
      pose.x * width +
      sway +
      Math.cos(orbitAngle) * width * 0.045 * orbital +
      px * (8 + (index % 4) * 4);
    const y =
      pose.y * height +
      drift +
      Math.sin(orbitAngle) * height * 0.045 * orbital +
      py * (8 + (index % 4) * 4);
    const r =
      pose.r +
      (paused ? 0 : Math.sin(elapsed * 0.5 + index) * 9) +
      burst * Math.sin(index + elapsed * 6) * 28 +
      orbital * Math.sin(elapsed * 0.3 + index) * 15;
    element.style.transform = `translate3d(${x - size / 2}px,${y - size * 0.625}px,0) rotate(${r}deg) scale(${pose.s})`;
  });
  const heroOpacity = 1 - windowOpacity(phase, 0.07, 0.95, 0.13);
  const orbitOpacity = windowOpacity(phase, 0.27, 0.6, 0.09);
  const bunchOpacity = windowOpacity(phase, 0.59, 0.89, 0.075);
  const opacities = [heroOpacity, orbitOpacity, bunchOpacity];
  scenes.forEach((scene, i) => {
    const opacity = opacities[i];
    scene.style.opacity = String(opacity);
    scene.style.transform = `translate3d(0,${(1 - opacity) * (i === 0 ? -65 : 55)}px,0) scale(${0.94 + opacity * 0.06})`;
  });
  const selected = opacities.indexOf(Math.max(...opacities));
  if (activeScene !== selected) {
    activeScene = selected;
    scenes.forEach((scene, i) =>
      scene.setAttribute('aria-hidden', String(i !== selected))
    );
    dots.forEach((dot, i) => dot.classList.toggle('active', i === selected));
    $('.scene-indicator').setAttribute(
      'aria-label',
      `Scene ${selected + 1} of 3`
    );
    $('.scene-indicator span').textContent = `0${selected + 1} — 03`;
    label.textContent =
      selected === 2
        ? 'KEEP GOING. GOOD THINGS COME AROUND.'
        : 'SCROLL TO GET A LITTLE LOST';
  }
  document.body.classList.toggle('in-space', space > 0.55);
  rings.forEach((ring, i) => {
    ring.style.opacity = String(1 - space * 0.6);
    ring.style.transform = `rotate(${(i ? 28 : -25) + (paused ? 0 : elapsed * (i ? -0.7 : 0.5)) + Math.sin(phase * Math.PI * 2) * 20}deg) scale(${1 + space * 0.3})`;
  });
  blobs.forEach((blob, i) => {
    blob.style.opacity = String(1 - space);
    blob.style.transform = `translate3d(${Math.sin(elapsed * 0.2 + i) * 40}px,${Math.cos(elapsed * 0.3 + i) * 55}px,0) rotate(${elapsed * (i ? 2 : -2)}deg)`;
  });
  if (!paused || Math.abs(target - current) > 0.05 || burst > 0) wake();
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener(
  'resize',
  () => {
    if (!resizeFrame) resizeFrame = requestAnimationFrame(measure);
  },
  { passive: true }
);
world.addEventListener(
  'pointermove',
  (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || paused || isStatic()) return;
    pointerX = event.clientX / width - 0.5;
    pointerY = event.clientY / height - 0.5;
    wake();
  },
  { passive: true }
);
world.addEventListener('pointerleave', () => {
  pointerX = pointerY = 0;
});
document.addEventListener('visibilitychange', () => {
  lastTime = 0;
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else wake();
});
reducedMotion.addEventListener('change', () => {
  cancelAnimationFrame(frame);
  frame = 0;
  measure();
});
toggle.addEventListener('click', () => {
  paused = !paused;
  document.body.classList.toggle('motion-paused', paused);
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute(
    'aria-label',
    paused ? 'Resume ambient animation' : 'Pause ambient animation'
  );
  toggleIcon.textContent = paused ? '▷' : 'Ⅱ';
  pointerX = pointerY = 0;
  wake();
});
$('.collection-cta').addEventListener('click', () => {
  if (!paused && !isStatic()) {
    burst = 1;
    wake();
  }
});
async function enter() {
  await document.fonts.ready;
  if (!isStatic()) await new Promise((resolve) => setTimeout(resolve, 1000));
  document.body.classList.add('ready');
  $('.loader').setAttribute('aria-hidden', 'true');
  ready = true;
  measure();
}
measure();
enter();

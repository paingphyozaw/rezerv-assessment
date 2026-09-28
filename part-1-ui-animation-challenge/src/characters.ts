import { fruit, friends } from './art.ts';

// Each character is five nested elements. Each one has a single job, so two
// animations never fight over the same property:
// character         follows the mouse
// character__float  floats up, down and sideways
// character__pose   scroll position, rotation and size
// character__spin   spins when the CTA is clicked
// character__body   wobbles; its SVG (__art) grows and tilts on hover (CSS)
// Every second character gets the --flip modifier: it tilts and waves the other way.
export interface Character {
  element: HTMLElement;
  float: HTMLElement;
  pose: HTMLElement;
  spin: HTMLElement;
  body: HTMLElement;
  index: number;
}

export function createCharacters(
  container: HTMLElement,
  count: number
): Character[] {
  container.innerHTML = Array.from({ length: count }, (_, i) => {
    const flip = i % 2 ? ' character--flip' : '';
    const art = fruit(friends[i % 4].kind, i, 'character__art');
    return `<div class="character${flip}"><div class="character__float"><div class="character__pose"><div class="character__spin"><div class="character__body">${art}</div></div></div></div></div>`;
  }).join('');
  return [...container.children].map((element, index) => {
    const find = (selector: string) =>
      element.querySelector(selector) as HTMLElement;
    return {
      element: element as HTMLElement,
      float: find('.character__float'),
      pose: find('.character__pose'),
      spin: find('.character__spin'),
      body: find('.character__body'),
      index
    };
  });
}

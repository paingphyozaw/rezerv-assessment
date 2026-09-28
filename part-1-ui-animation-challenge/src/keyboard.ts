// Lenis loops wheel and touch scrolling forever. Keys scroll the page the
// normal browser way, which stops at the top and bottom. main.ts sends these
// keys through Lenis instead, so keyboard scrolling loops too.

export interface KeyContext {
  shift: boolean;
  /** Space on a focused button should press the button, not scroll. */
  onButton: boolean;
  pageHeight: number;
}

/** How far a key should scroll, in pixels, or null if it is not a scroll key. */
export function keyScrollDistance(
  key: string,
  { shift, onButton, pageHeight }: KeyContext
): number | null {
  const onePage = pageHeight * 0.9;
  switch (key) {
    case 'ArrowDown':
      return 40;
    case 'ArrowUp':
      return -40;
    case 'PageDown':
      return onePage;
    case 'PageUp':
      return -onePage;
    case ' ':
      if (onButton) return null;
      return shift ? -onePage : onePage;
    default:
      return null;
  }
}

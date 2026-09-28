import { useEffect, useRef, useState, type UIEvent } from 'react';

/**
 * Watches the scroll box around the table. `width` keeps opened rows inside the
 * visible part, and `scrolled` turns on the pinned column's shadow.
 */
export function useTableViewport() {
  const ref = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(0);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const update = () => setWidth(element.clientWidth);

    update();

    const observer = new ResizeObserver(update);

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // React skips the re-render when `scrolled` does not change, so scrolling stays cheap.
  const onScroll = (event: UIEvent<HTMLDivElement>) =>
    setScrolled(event.currentTarget.scrollLeft > 0);

  return { ref, width, scrolled, onScroll };
}

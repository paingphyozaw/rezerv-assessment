import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Expand } from './types';

export type ChildState<C> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; children: C[] };

/**
 * Loads and caches child rows for lazy expand, one entry per row id.
 * Closing a row while it loads aborts the request; loaded rows stay cached.
 */
export function useChildRows<T, C>(expand: Expand<T, C> | undefined) {
  const [states, setStates] = useState<ReadonlyMap<string, ChildState<C>>>(() => new Map());

  const controllers = useRef(new Map<string, AbortController>());

  // The latest values, for callbacks that must stay the same between renders.
  const expandRef = useRef(expand);

  const statesRef = useRef(states);

  useLayoutEffect(() => {
    expandRef.current = expand;
    statesRef.current = states;
  });

  const setChildState = useCallback((id: string, next: ChildState<C> | null) => {
    setStates((previous) => {
      const copy = new Map(previous);

      if (next) copy.set(id, next);
      else copy.delete(id);
      return copy;
    });
  }, []);

  const load = useCallback(
    async (row: T, id: string) => {
      const current = expandRef.current;

      if (current?.mode !== 'lazy') return;
      controllers.current.get(id)?.abort();

      const controller = new AbortController();

      controllers.current.set(id, controller);
      setChildState(id, { status: 'loading' });
      try {
        const children = await current.loadChildren(row, controller.signal);

        if (!controller.signal.aborted) setChildState(id, { status: 'ready', children });
      } catch {
        if (!controller.signal.aborted) setChildState(id, { status: 'error' });
      } finally {
        if (controllers.current.get(id) === controller) controllers.current.delete(id);
      }
    },
    [setChildState]
  );

  /** Loads when a row opens, unless its children are already loaded or loading. */
  const loadIfNeeded = useCallback(
    (row: T, id: string) => {
      const status = statesRef.current.get(id)?.status;

      if (status !== 'ready' && status !== 'loading') load(row, id);
    },
    [load]
  );

  /** Stops a load that is still running. */
  const cancel = useCallback(
    (id: string) => {
      const controller = controllers.current.get(id);

      if (!controller) return;
      controller.abort();
      controllers.current.delete(id);
      setChildState(id, null);
    },
    [setChildState]
  );

  useEffect(() => {
    const running = controllers.current;

    return () => running.forEach((controller) => controller.abort());
  }, []);

  return { states, load, loadIfNeeded, cancel };
}

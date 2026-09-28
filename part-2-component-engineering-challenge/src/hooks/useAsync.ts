import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncStatus = 'loading' | 'error' | 'ready';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | undefined;
  error: unknown;
}

/**
 * A memoized loader identifies a request. Changing it cancels the previous request.
 * `initialData` is read on the first render only. It answers the first loader, so that
 * loader is not called (not even by a Strict Mode replay) until it changes or `retry` runs.
 * Later requests retain the last result while loading; retry always calls the loader.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, initialData?: T) {
  // The first loader, when initialData already holds its answer.
  const answeredLoad = useRef(initialData === undefined ? null : load);

  const [state, setState] = useState<AsyncState<T>>(() => ({
    status: initialData === undefined ? 'loading' : 'ready',
    data: initialData,
    error: undefined
  }));

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (load === answeredLoad.current && attempt === 0) return;

    const controller = new AbortController();

    setState((previous) => ({ ...previous, status: 'loading', error: undefined }));

    async function run() {
      try {
        const data = await load(controller.signal);

        if (!controller.signal.aborted) setState({ status: 'ready', data, error: undefined });
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setState((previous) => ({ ...previous, status: 'error', error }));
        }
      }
    }

    void run();
    return () => controller.abort();
  }, [load, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}

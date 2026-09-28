import { useCallback, StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsync } from '../src/hooks/useAsync';

interface Call {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  signal: AbortSignal;
}

function controlledLoader() {
  const calls: Call[] = [];

  const load = vi.fn(
    (signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => calls.push({ resolve, reject, signal }))
  );

  return { calls, load };
}

describe('useAsync', () => {
  it('uses included data without fetching, then loads on retry even in Strict Mode', async () => {
    const { calls, load } = controlledLoader();

    const { result } = renderHook(() => useAsync(load, 'included'), { wrapper: StrictMode });

    expect(result.current).toMatchObject({ status: 'ready', data: 'included' });
    expect(load).not.toHaveBeenCalled();
    act(() => result.current.retry());
    expect(load).toHaveBeenCalledOnce();
    await act(async () => calls[0].resolve('refreshed'));
    expect(result.current.data).toBe('refreshed');
  });

  it('shows errors and runs again on retry', async () => {
    const { calls, load } = controlledLoader();

    const { result } = renderHook(() => useAsync(load));

    expect(result.current.status).toBe('loading');
    await act(async () => calls[0].reject(new Error('down')));
    expect(result.current.status).toBe('error');
    act(() => result.current.retry());
    expect(load).toHaveBeenCalledTimes(2);
    await act(async () => calls[1].resolve('back'));
    expect(result.current).toMatchObject({ status: 'ready', data: 'back' });
  });

  it('retains data during refresh and ignores an aborted request that resolves late', async () => {
    const { calls, load } = controlledLoader();

    const { result, rerender } = renderHook(
      ({ query }) => {
        const loader = useCallback((signal: AbortSignal) => load(signal), [query]);

        return useAsync(loader);
      },
      { initialProps: { query: 'a' } }
    );

    await act(async () => calls[0].resolve('answer a'));
    rerender({ query: 'b' });
    expect(result.current).toMatchObject({ status: 'loading', data: 'answer a' });
    rerender({ query: 'c' });
    expect(calls[1].signal.aborted).toBe(true);
    await act(async () => calls[2].resolve('answer c'));
    await act(async () => calls[1].resolve('late answer b'));
    expect(result.current.data).toBe('answer c');
  });
});

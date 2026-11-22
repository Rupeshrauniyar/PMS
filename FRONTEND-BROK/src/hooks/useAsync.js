import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage, isAborted } from "@/lib/errors";

/**
 * Minimal data-fetching hook.
 *
 * @param {(ctx: { signal: AbortSignal }) => Promise<any>} fetcher
 * @param {any[]} deps  re-run when these change
 * @param {{ enabled?: boolean, initialData?: any, keepPrevious?: boolean }} [options]
 * @returns {{ data, setData, error, loading, refreshing, refetch }}
 *   - `loading`: true only while there is no data yet (show skeletons)
 *   - `refreshing`: true during a background refetch (show a subtle spinner)
 */
export function useAsync(fetcher, deps = [], options = {}) {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled && initialData == null);
  const [refreshing, setRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const controllerRef = useRef(null);
  const hasDataRef = useRef(initialData != null);

  const run = useCallback(async ({ background = false } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (background || hasDataRef.current) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetcherRef.current({ signal: controller.signal });
      if (controller.signal.aborted) return undefined;
      hasDataRef.current = true;
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      if (isAborted(err) || controller.signal.aborted) return undefined;
      setError({ message: getErrorMessage(err), status: err?.response?.status ?? 0, raw: err });
      return undefined;
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    hasDataRef.current = false;
    run();
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  const refetch = useCallback(() => run({ background: true }), [run]);

  return { data, setData, error, loading, refreshing, refetch };
}

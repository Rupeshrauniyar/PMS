import { useCallback, useEffect, useRef, useState } from "react";
import * as brokerApi from "@/api/broker";
import { useAsync } from "./useAsync";
import { useVisiblePolling } from "./usePageVisible";
import { getErrorMessage, isAborted, isConflict } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/** Dashboard counts + upcoming agenda, plus the "needs scheduling" list. */
export function useDashboard() {
  const dash = useAsync(({ signal }) => brokerApi.getDashboard({ signal }), []);
  const claimed = useAsync(
    ({ signal }) =>
      brokerApi.getMyVisits({ status: "claimed" }, { signal }).then((r) => r.visits ?? []),
    [],
  );

  const refetch = useCallback(
    () => Promise.all([dash.refetch(), claimed.refetch()]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dash.refetch, claimed.refetch],
  );

  return {
    data: dash.data,
    counts: dash.data?.counts ?? null,
    upcoming: dash.data?.upcoming ?? [],
    needsScheduling: claimed.data ?? [],
    loading: dash.loading,
    needsSchedulingLoading: claimed.loading,
    refreshing: dash.refreshing || claimed.refreshing,
    error: dash.error,
    refetch,
  };
}

/* ------------------------------------------------------------------ */
/* Pool                                                                */
/* ------------------------------------------------------------------ */

const POOL_PAGE_SIZE = 12;
const POOL_REFRESH_MS = 30_000;
const POOL_MAX_LIMIT = 50;

/**
 * Infinite-scrolling open pool with auto refresh (while visible) and
 * optimistic claim.
 *
 * `claim(id)` resolves to `{ ok: true, visit }`, `{ ok: false, conflict: true }`
 * (someone else won — the card is removed) or `{ ok: false, message }`.
 */
export function usePool({ pageSize = POOL_PAGE_SIZE, autoRefresh = true } = {}) {
  const [visits, setVisits] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState({}); // id -> true

  const pageRef = useRef(0);
  const reqId = useRef(0);
  const controllerRef = useRef(null);

  /** Reload pages 1..n (n = pages currently shown, min 1). */
  const reload = useCallback(
    async ({ background = false } = {}) => {
      const id = ++reqId.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        // Backend caps `limit` at 50, so refresh at most that many items.
        const maxPages = Math.max(1, Math.floor(POOL_MAX_LIMIT / pageSize));
        const pages = Math.min(Math.max(1, pageRef.current), maxPages);
        const res = await brokerApi.getPool(
          { page: 1, limit: pageSize * pages },
          { signal: controller.signal },
        );
        if (id !== reqId.current) return;
        setVisits(res.visits ?? []);
        setTotal(res.total ?? 0);
        const tp = Math.max(1, Math.ceil((res.total ?? 0) / pageSize));
        setTotalPages(tp);
        pageRef.current = Math.min(pages, tp);
        setPage(pageRef.current);
        setError(null);
      } catch (err) {
        if (isAborted(err) || id !== reqId.current) return;
        setError({ message: getErrorMessage(err), status: err?.response?.status ?? 0 });
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [pageSize],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || pageRef.current >= totalPages) return;
    const next = pageRef.current + 1;
    const id = reqId.current;
    setLoadingMore(true);
    try {
      const res = await brokerApi.getPool({ page: next, limit: pageSize });
      if (id !== reqId.current) return; // a reload happened meanwhile
      setVisits((prev) => {
        const seen = new Set(prev.map((v) => v._id));
        return [...prev, ...(res.visits ?? []).filter((v) => !seen.has(v._id))];
      });
      setTotal(res.total ?? 0);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
      pageRef.current = next;
      setPage(next);
    } catch (err) {
      setError({ message: getErrorMessage(err), status: err?.response?.status ?? 0 });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, totalPages, pageSize]);

  useEffect(() => {
    pageRef.current = 1;
    reload();
    return () => controllerRef.current?.abort();
  }, [reload]);

  useVisiblePolling(() => reload({ background: true }), POOL_REFRESH_MS, {
    enabled: autoRefresh,
  });

  const removeLocal = useCallback((id) => {
    setVisits((prev) => prev.filter((v) => v._id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const claim = useCallback(
    async (id) => {
      setClaiming((c) => ({ ...c, [id]: true }));
      try {
        const res = await brokerApi.claimVisit(id);
        removeLocal(id); // optimistic: it's ours now, not in the pool
        return { ok: true, visit: res.visit };
      } catch (err) {
        if (isConflict(err)) {
          removeLocal(id);
          return { ok: false, conflict: true, message: getErrorMessage(err) };
        }
        return { ok: false, message: getErrorMessage(err, "Couldn't claim this visit.") };
      } finally {
        setClaiming((c) => {
          const next = { ...c };
          delete next[id];
          return next;
        });
      }
    },
    [removeLocal],
  );

  return {
    visits,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
    loading,
    loadingMore,
    refreshing,
    error,
    claiming,
    claim,
    loadMore,
    refetch: () => reload({ background: true }),
  };
}

/* ------------------------------------------------------------------ */
/* My visits / all visits / calendar                                  */
/* ------------------------------------------------------------------ */

/**
 * @param {{ status?: string, from?: string, to?: string }} params
 */
export function useMyVisits(params = {}, { enabled = true } = {}) {
  const key = JSON.stringify(params);
  const q = useAsync(
    ({ signal }) => brokerApi.getMyVisits(params, { signal }).then((r) => r.visits ?? []),
    [key],
    { enabled },
  );
  return { ...q, visits: q.data ?? [] };
}

/** Superbroker only. */
export function useAllVisits(params = {}, { enabled = true } = {}) {
  const key = JSON.stringify(params);
  const q = useAsync(
    ({ signal }) => brokerApi.getAllVisits(params, { signal }).then((r) => r.visits ?? []),
    [key],
    { enabled },
  );
  return { ...q, visits: q.data ?? [] };
}

/** Superbroker only. */
export function useBrokers({ enabled = true } = {}) {
  const q = useAsync(
    ({ signal }) => brokerApi.getBrokers({ signal }).then((r) => r.brokers ?? []),
    [],
    { enabled },
  );
  return { ...q, brokers: q.data ?? [] };
}

/* ------------------------------------------------------------------ */
/* Single visit + actions                                              */
/* ------------------------------------------------------------------ */

/**
 * Loads one visit and exposes every state transition. Each action resolves
 * to `{ ok, visit?, message?, conflict? }` and updates the local copy.
 */
export function useVisit(id) {
  const q = useAsync(
    ({ signal }) => brokerApi.getVisit(id, { signal }).then((r) => r.visit),
    [id],
    { enabled: Boolean(id) },
  );
  const [pending, setPending] = useState(null); // action name in flight
  const { setData, refetch } = q;

  const act = useCallback(
    async (name, fn) => {
      setPending(name);
      try {
        const res = await fn();
        if (res?.visit) setData(res.visit);
        return { ok: true, visit: res?.visit };
      } catch (err) {
        const conflict = isConflict(err);
        if (conflict) refetch(); // state moved on server-side — resync
        return { ok: false, conflict, message: getErrorMessage(err) };
      } finally {
        setPending(null);
      }
    },
    [setData, refetch],
  );

  const actions = {
    claim: () => act("claim", () => brokerApi.claimVisit(id)),
    release: (reason) => act("release", () => brokerApi.releaseVisit(id, { reason })),
    schedule: (payload) => act("schedule", () => brokerApi.scheduleVisit(id, payload)),
    complete: (outcome) => act("complete", () => brokerApi.completeVisit(id, { outcome })),
    noShow: (outcome) => act("noShow", () => brokerApi.markNoShow(id, { outcome })),
    cancel: (reason) => act("cancel", () => brokerApi.cancelVisit(id, { reason })),
    reassign: (brokerId) => act("reassign", () => brokerApi.reassignVisit(id, brokerId)),
  };

  return { ...q, visit: q.data, pending, actions };
}

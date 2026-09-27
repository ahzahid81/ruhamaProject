import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import queryCache, { DEFAULT_STALE_TIME } from "../services/queryClient";

const IDLE_SNAPSHOT = Object.freeze({
  status: "idle",
  data: undefined,
  error: null,
  updatedAt: 0,
});

export default function useQuery(queryKey, fetcher, options = {}) {
  const {
    enabled = true,
    staleTime = DEFAULT_STALE_TIME,
    keepPreviousData = false,
  } = options;

  const key = enabled && queryKey ? String(queryKey) : null;

  const [previousData, setPreviousData] = useState(undefined);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = useCallback(
    (listener) => {
      if (!key) return () => {};
      return queryCache.subscribe(key, () => {
        listener();
        if (!keepPreviousData) return;
        const next = queryCache.getSnapshot(key).data;
        if (next !== undefined) setPreviousData(next);
      });
    },
    [key, keepPreviousData]
  );

  const getSnapshot = useCallback(
    () => (key ? queryCache.getSnapshot(key) : IDLE_SNAPSHOT),
    [key]
  );

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!key) return;
    queryCache.ensure(key, () => fetcherRef.current?.(), { staleTime });
  }, [key, staleTime]);

  const refetch = useCallback(
    () => (key ? queryCache.refetch(key) : Promise.resolve()),
    [key]
  );

  const setData = useCallback(
    (updater) => {
      if (!key) return;
      const current = queryCache.getSnapshot(key).data;
      queryCache.setData(key, typeof updater === "function" ? updater(current) : updater);
    },
    [key]
  );

  const hasData = snapshot.data !== undefined;
  const data = hasData ? snapshot.data : keepPreviousData ? previousData : undefined;

  return {
    data,
    error: snapshot.error,
    status: snapshot.status,
    loading: key ? !hasData && (snapshot.status === "loading" || snapshot.status === "idle") : false,
    isFetching: key ? snapshot.status === "loading" : false,
    refetch,
    setData,
  };
}

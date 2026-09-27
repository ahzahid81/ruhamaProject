const DEFAULT_STALE_TIME = 30_000;

const IDLE_SNAPSHOT = Object.freeze({
  status: "idle",
  data: undefined,
  error: null,
  updatedAt: 0,
});

const store = new Map();

const getEntry = (key) => {
  let entry = store.get(key);
  if (!entry) {
    entry = {
      status: "idle",
      data: undefined,
      error: null,
      updatedAt: 0,
      promise: null,
      fetcher: null,
      listeners: new Set(),
      snapshot: IDLE_SNAPSHOT,
    };
    store.set(key, entry);
  }
  return entry;
};

const publish = (entry) => {
  entry.snapshot = Object.freeze({
    status: entry.status,
    data: entry.data,
    error: entry.error,
    updatedAt: entry.updatedAt,
  });
  entry.listeners.forEach((listener) => listener());
};

const run = (key, fetcher, { force = false, staleTime = DEFAULT_STALE_TIME } = {}) => {
  const entry = getEntry(key);
  if (typeof fetcher === "function") entry.fetcher = fetcher;
  if (entry.promise) return entry.promise;

  const fresh = entry.status === "success" && Date.now() - entry.updatedAt < staleTime;
  if (fresh && !force) return Promise.resolve(entry);

  entry.status = "loading";
  entry.error = null;
  publish(entry);

  const promise = Promise.resolve()
    .then(() => (typeof entry.fetcher === "function" ? entry.fetcher() : undefined))
    .then((data) => {
      entry.status = "success";
      entry.data = data;
      entry.error = null;
      entry.updatedAt = Date.now();
      entry.promise = null;
      publish(entry);
      return entry;
    })
    .catch((error) => {
      entry.status = "error";
      entry.error = error;
      entry.promise = null;
      publish(entry);
      return entry;
    });

  entry.promise = promise;
  return promise;
};

const matches = (key, matcher) => {
  if (!matcher || matcher === "*") return true;
  if (matcher instanceof RegExp) return matcher.test(key);
  if (typeof matcher === "string") {
    return key === matcher || key.startsWith(matcher.endsWith(":") ? matcher : `${matcher}:`);
  }
  return false;
};

const queryCache = {
  DEFAULT_STALE_TIME,

  getSnapshot(key) {
    return getEntry(key).snapshot;
  },

  subscribe(key, listener) {
    const entry = getEntry(key);
    entry.listeners.add(listener);
    return () => entry.listeners.delete(listener);
  },

  ensure(key, fetcher, options) {
    const entry = getEntry(key);
    if (entry.promise) return entry.promise;
    if (entry.status === "success") return run(key, fetcher, options);
    return run(key, fetcher, { ...options, force: true });
  },

  refetch(key, options) {
    return run(key, null, { ...options, force: true });
  },

  prefetch(key, fetcher, options) {
    const entry = getEntry(key);
    if (entry.promise) return entry.promise;
    if (entry.status === "success") return Promise.resolve(entry);
    return run(key, fetcher, options);
  },

  invalidate(...matchers) {
    const targets = [];
    store.forEach((entry, key) => {
      if (!matchers.some((matcher) => matches(key, matcher))) return;
      if (entry.status === "idle") return;
      targets.push(run(key, entry.fetcher, { force: true }));
    });
    return Promise.all(targets);
  },

  setData(key, data) {
    const entry = getEntry(key);
    entry.status = "success";
    entry.data = data;
    entry.error = null;
    entry.updatedAt = Date.now();
    entry.promise = null;
    publish(entry);
  },

  remove(key) {
    store.delete(key);
  },

  clear() {
    store.clear();
  },

  keys() {
    return [...store.keys()];
  },
};

export default queryCache;
export { DEFAULT_STALE_TIME };

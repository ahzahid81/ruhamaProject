import api from "./api";
import queryCache from "./queryClient";

const SETTINGS_KEY = "settings";

const fetchSettings = () => api.get("/settings").then((res) => res.data);

const settle = (entry) => {
  if (entry.status === "error") throw entry.error;
  return { data: entry.data };
};

export function getSettings({ force = false } = {}) {
  return queryCache
    .ensure(SETTINGS_KEY, fetchSettings, { force, staleTime: 5 * 60_000 })
    .then(settle);
}

export function refreshSettings() {
  return getSettings({ force: true });
}

export function clearSettingsCache() {
  queryCache.remove(SETTINGS_KEY);
}

export function invalidateSettings() {
  return queryCache.invalidate(SETTINGS_KEY);
}

export { SETTINGS_KEY, fetchSettings };

import api from "./api";

let settingsPromise = null;

export function getSettings() {
  if (!settingsPromise) {
    settingsPromise = api
      .get("/settings")
      .then((res) => ({ data: res.data }))
      .catch((err) => {
        settingsPromise = null;
        throw err;
      });
  }
  return settingsPromise;
}

export function refreshSettings() {
  settingsPromise = null;
  return getSettings();
}

export function clearSettingsCache() {
  settingsPromise = null;
}
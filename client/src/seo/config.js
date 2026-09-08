export const SITE_NAME = "Ruhama United School";
export const SITE_URL = "https://ruhamaunitedschool.com";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const API_ORIGIN = API_BASE
  ? API_BASE.replace(/\/+$/, "").replace(/\/api$/, "")
  : SITE_URL;

export function absoluteUrl(path) {
  if (!path) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
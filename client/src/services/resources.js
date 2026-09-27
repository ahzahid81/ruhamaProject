import { useEffect, useState } from "react";
import api from "./api";
import queryCache from "./queryClient";
import useQuery from "../hooks/useQuery";
import { fetchSettings } from "./settingsCache";

export const keys = {
  settings: "settings",
  exams: "exams",
  feeCategories: "payments:fee-categories",
  students: "students",
  studentsSearch: "students:search",
  dashboard: "dashboard:summary",
  publicCounts: "public:counts",
  publicStudents: "public:students",
  events: "events",
  gallery: "gallery",
  payments: "payments",
  fees: "fees",
  ledger: "ledger",
  attendance: "attendance",
  examAttendance: "exam-attendance",
  hifz: "hifz",
  statement: "statement",
};

const stableParams = (params) => {
  if (!params) return "";
  if (typeof params === "string") return params;
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
};

const asArray = (payload, field) => {
  if (Array.isArray(payload)) return payload;
  if (field && Array.isArray(payload?.[field])) return payload[field];
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.students)) return payload.students;
  return [];
};

export const fetcher = {
  settings: fetchSettings,
  exams: () => api.get("/exams").then((res) => asArray(res.data, "exams")),
  feeCategories: () =>
    api.get("/payments/fee-categories").then((res) => asArray(res.data, "categories")),
  students: (params = {}) => {
    const qs = stableParams(params);
    return api.get(`/students${qs ? `?${qs}` : ""}`).then((res) => asArray(res.data));
  },
  studentSearch: (term) =>
    api
      .get(`/students/search?q=${encodeURIComponent(term)}`)
      .then((res) => asArray(res.data)),
  dashboard: () => api.get("/dashboard/summary").then((res) => res.data),
  publicCounts: () => api.get("/public/counts").then((res) => res.data),
  publicStudents: () => api.get("/public/students").then((res) => asArray(res.data)),
  events: (limit = 4) => api.get(`/events?limit=${limit}`).then((res) => asArray(res.data)),
  gallery: (limit = 10) => api.get(`/gallery?limit=${limit}`).then((res) => asArray(res.data)),
};

export function useSettings(options) {
  return useQuery(keys.settings, fetcher.settings, { staleTime: 5 * 60_000, ...options });
}

export function useExams(options) {
  return useQuery(keys.exams, fetcher.exams, { staleTime: 60_000, ...options });
}

export function useFeeCategories(options) {
  return useQuery(keys.feeCategories, fetcher.feeCategories, {
    staleTime: 60_000,
    ...options,
  });
}

export function useStudents(params = {}, options) {
  const qs = stableParams(params);
  return useQuery(`${keys.students}:${qs}`, () => fetcher.students(params), {
    keepPreviousData: true,
    ...options,
  });
}

export function useDashboardSummary(options) {
  return useQuery(keys.dashboard, fetcher.dashboard, { ...options });
}

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useStudentSearch(term, options = {}) {
  const { debounce = 250, ...rest } = options;
  const debouncedTerm = useDebouncedValue(term, debounce);
  const query = debouncedTerm.trim();

  return useQuery(
    query ? `${keys.studentsSearch}:${query}` : null,
    () => fetcher.studentSearch(query),
    { staleTime: 30_000, keepPreviousData: true, ...rest }
  );
}

export function useLandingData() {
  const students = useQuery(keys.publicStudents, fetcher.publicStudents, {
    staleTime: 5 * 60_000,
  });
  const counts = useQuery(keys.publicCounts, fetcher.publicCounts, {
    staleTime: 5 * 60_000,
  });
  const events = useQuery(`${keys.events}:4`, () => fetcher.events(4), {
    staleTime: 60_000,
  });
  const gallery = useQuery(`${keys.gallery}:10`, () => fetcher.gallery(10), {
    staleTime: 5 * 60_000,
  });

  return {
    students,
    counts,
    events,
    gallery,
    loading:
      students.loading || counts.loading || events.loading || gallery.loading,
  };
}

export const invalidate = {
  settings: () => queryCache.invalidate(keys.settings),
  exams: () => queryCache.invalidate(keys.exams),
  feeCategories: () => queryCache.invalidate(keys.feeCategories),
  students: () => queryCache.invalidate(keys.students),
  payments: () => queryCache.invalidate(keys.payments, keys.ledger),
  fees: () => queryCache.invalidate(keys.fees, keys.payments, keys.ledger),
  attendance: () => queryCache.invalidate(keys.attendance, keys.examAttendance),
  hifz: () => queryCache.invalidate(keys.hifz),
  statement: () => queryCache.invalidate(keys.statement),
  all: () => queryCache.invalidate("*"),
};

export default queryCache;

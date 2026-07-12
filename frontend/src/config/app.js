export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const HISTORY_HOURS = 72;
export const POLL_INTERVAL_MS = 10_000;
export const PREDICTION_DEBOUNCE_MS = 300;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const DASHBOARD_CONCURRENCY = 3;

export const DATE_LOCALE = import.meta.env.VITE_DATE_LOCALE || undefined;
export const TIME_ZONE = import.meta.env.VITE_TIME_ZONE || undefined;

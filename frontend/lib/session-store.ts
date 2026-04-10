import type { InterviewSnapshot, PrepareResponse, ReportSnapshot } from "@/lib/types";

const STORAGE_KEY = "ai-interviewer.frontend.snapshot";

export type AppSnapshot = {
  prepare?: PrepareResponse;
  interview?: InterviewSnapshot;
  report?: ReportSnapshot;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadAppSnapshot(): AppSnapshot | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AppSnapshot;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveAppSnapshot(snapshot: AppSnapshot): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function updateAppSnapshot(partial: Partial<AppSnapshot>): AppSnapshot | null {
  const current = loadAppSnapshot() ?? {};
  const next = {
    ...current,
    ...partial,
  };

  saveAppSnapshot(next);
  return next;
}

export function clearAppSnapshot(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

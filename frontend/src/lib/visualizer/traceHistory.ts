import { TraceResponsePayload } from "@/lib/api/types";

export interface TraceHistoryEntry {
  id: string;
  timestamp: string;
  title: string;
  sourceCode: string;
  stepCount: number;
  status: string;
  executionTimeMs: number;
  trace: TraceResponsePayload;
}

const STORAGE_KEY = "codevista_trace_history_v1";
export const MAX_HISTORY_ITEMS = 20;

/**
 * Retrieve execution trace history from localStorage.
 */
export function getTraceHistory(): TraceHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist an execution trace into local history, capping at MAX_HISTORY_ITEMS.
 */
export function saveTraceToHistory(
  trace: TraceResponsePayload,
  sourceCode: string,
  customTitle?: string
): TraceHistoryEntry | null {
  if (typeof window === "undefined" || !trace || !trace.steps || trace.steps.length === 0) {
    return null;
  }
  try {
    const existing = getTraceHistory();

    let title = customTitle;
    if (!title) {
      const firstCodeLine = sourceCode
        .split("\n")
        .map((l) => l.trim())
        .find(
          (l) =>
            l.length > 0 &&
            !l.startsWith("//") &&
            !l.startsWith("/*") &&
            !l.startsWith("import ") &&
            !l.startsWith("package ")
        );
      title = firstCodeLine ? firstCodeLine.substring(0, 38) : "Execution Trace";
    }

    const newEntry: TraceHistoryEntry = {
      id: "trace_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      title,
      sourceCode,
      stepCount: trace.totalSteps || trace.steps.length,
      status: trace.status || "SUCCESS",
      executionTimeMs: trace.executionTimeMs || 0,
      trace,
    };

    // Filter out near-immediate duplicate runs of identical code
    const filtered = existing.filter(
      (item) =>
        item.sourceCode !== sourceCode ||
        Date.now() - new Date(item.timestamp).getTime() > 3000
    );

    const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  } catch {
    return null;
  }
}

/**
 * Delete a single history entry by its unique ID.
 */
export function deleteTraceHistoryItem(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getTraceHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Purge all trace history entries.
 */
export function clearTraceHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

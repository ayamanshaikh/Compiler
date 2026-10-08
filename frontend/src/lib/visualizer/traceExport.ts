/**
 * CodeVista AI - Portable Trace Export & Import Engine
 * 
 * Enables serialization, download, and hydration of authentic JVM execution
 * traces for offline replay, classroom sharing, and test archiving.
 */

import { TraceResponsePayload } from "@/lib/api/types";

export interface ExportedTraceSession {
  schemaVersion: "1.0.0";
  exportedAt: string;
  language: string;
  sourceCode: string;
  trace: TraceResponsePayload;
}

export function exportTraceToJson(
  trace: TraceResponsePayload,
  sourceCode: string
): string {
  const session: ExportedTraceSession = {
    schemaVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    language: "java",
    sourceCode,
    trace,
  };
  return JSON.stringify(session, null, 2);
}

export function downloadTraceFile(
  trace: TraceResponsePayload,
  sourceCode: string,
  fileName: string = "codevista-trace.json"
): void {
  if (typeof window === "undefined") return;

  const jsonStr = exportTraceToJson(trace, sourceCode);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function parseImportedTrace(jsonContent: string): {
  trace: TraceResponsePayload;
  sourceCode: string;
} {
  try {
    const parsed = JSON.parse(jsonContent);

    // Validate structure
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid trace JSON: root object missing");
    }

    if (parsed.schemaVersion === "1.0.0" && parsed.trace && parsed.sourceCode) {
      return {
        trace: parsed.trace as TraceResponsePayload,
        sourceCode: String(parsed.sourceCode),
      };
    }

    // Direct trace payload without wrapper
    if (Array.isArray(parsed.steps) && parsed.status) {
      return {
        trace: parsed as TraceResponsePayload,
        sourceCode: typeof parsed.sourceCode === "string" ? parsed.sourceCode : "",
      };
    }

    throw new Error("Unsupported trace JSON schema format");
  } catch (err: unknown) {
    throw new Error(
      err instanceof Error
        ? `Trace import failed: ${err.message}`
        : "Corrupted trace JSON file"
    );
  }
}

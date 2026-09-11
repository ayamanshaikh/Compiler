import { CompileResponse, HistoryEntry } from "./types";

// When behind Next.js proxy rewrites, use the relative /api path so
// the request goes through Next.js → Spring Boot without CORS issues.
// For standalone use, set NEXT_PUBLIC_COMPILER_API to the full backend URL.
const API_BASE = process.env.NEXT_PUBLIC_COMPILER_API || "/api";

export async function compileJava(
  code: string,
  language: string = "java"
): Promise<CompileResponse> {
  const response = await fetch(`${API_BASE}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language }),
  });

  // The backend returns structured bodies even for 4xx validation errors;
  // surface those instead of throwing away the explanation.
  if (!response.ok) {
    try {
      const body = (await response.json()) as CompileResponse;
      if (body && typeof body === "object" && "success" in body) {
        return body;
      }
    } catch {
      // fall through to the generic error below
    }
    throw new Error(`Backend returned HTTP ${response.status}`);
  }

  return response.json();
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_BASE}/history`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}`);
  }

  return response.json();
}
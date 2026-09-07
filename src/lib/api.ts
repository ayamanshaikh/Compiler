import { CompileResponse } from "./types";

// When behind Next.js proxy rewrites, use the relative /api path so
// the request goes through Next.js → Spring Boot without CORS issues.
// For standalone use, set NEXT_PUBLIC_COMPILER_API to the full backend URL.
const API_BASE =
  process.env.NEXT_PUBLIC_COMPILER_API || "/api";

export async function compileJava(code: string): Promise<CompileResponse> {
  const response = await fetch(`${API_BASE}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}`);
  }

  return response.json();
}

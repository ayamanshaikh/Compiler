/**
 * CodeVista AI - Portable Trace URL Sharing Engine
 *
 * Encodes and decodes source code and step positions into URL hash state,
 * allowing instant peer-to-peer and classroom code sharing without backend database storage.
 */

export interface SharedTraceState {
  code: string;
  stepIndex?: number;
}

/**
 * Encodes UTF-8 source code and step index into a URL-safe base64 hash.
 */
export function encodeSharedTrace(code: string, stepIndex?: number): string {
  try {
    const payload = JSON.stringify({
      v: 1,
      c: code,
      s: typeof stepIndex === "number" ? stepIndex : 0,
    });
    // UTF-8 safe base64 encoding
    const encoded = typeof window !== "undefined"
      ? btoa(encodeURIComponent(payload).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        ))
      : Buffer.from(payload, "utf-8").toString("base64");
    return encodeURIComponent(encoded);
  } catch {
    return "";
  }
}

/**
 * Decodes a URL-safe base64 hash back into source code and step index.
 */
export function decodeSharedTrace(hash: string): SharedTraceState | null {
  try {
    if (!hash) return null;
    const cleanHash = hash.replace(/^#share=|^share=|^#/, "");
    const decodedUri = decodeURIComponent(cleanHash);
    
    // UTF-8 safe base64 decoding
    const jsonStr = typeof window !== "undefined"
      ? decodeURIComponent(
          Array.prototype.map
            .call(atob(decodedUri), (c: string) =>
              "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
            )
            .join("")
        )
      : Buffer.from(decodedUri, "base64").toString("utf-8");

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object" || typeof parsed.c !== "string") {
      return null;
    }

    return {
      code: parsed.c,
      stepIndex: typeof parsed.s === "number" ? parsed.s : undefined,
    };
  } catch {
    return null;
  }
}

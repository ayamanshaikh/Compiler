import { ApiError, ErrorResponse } from "./types";
import { apiCache } from "../cache/apiCache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  cacheTtlMs?: number;
  skipCache?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions & { body?: unknown } = {}
): Promise<T> {
  const { params, body, headers, cacheTtlMs, skipCache, ...customConfig } = options;

  let url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const method = customConfig.method?.toUpperCase() || "GET";
  const cacheKey = `${method}:${url}`;

  // Check client-side memory cache for GET requests
  if (method === "GET" && !skipCache && cacheTtlMs) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("codevista_token") : null;

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorPayload: ErrorResponse;
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = {
          timestamp: new Date().toISOString(),
          status: response.status,
          error: response.statusText || "HTTP Error",
          message: `Request failed with status ${response.status}`,
          path: endpoint,
        };
      }
      throw new ApiError(errorPayload);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      if (method !== "GET") {
        apiCache.clear();
      }
      return {} as T;
    }

    const data = (await response.json()) as T;

    if (method === "GET" && cacheTtlMs) {
      apiCache.set(cacheKey, data, cacheTtlMs);
    } else if (method !== "GET") {
      // Invalidate client-side cache on mutations
      apiCache.clear();
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError({
      status: 0,
      message: error instanceof Error ? error.message : "Network error occurred",
    });
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

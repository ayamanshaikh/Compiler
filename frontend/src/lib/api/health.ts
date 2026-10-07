import { apiClient } from "./client";
import { HealthResponse, PingRequest, PingResponse } from "./types";

export async function fetchHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>("health");
}

export async function pingBackend(message: string): Promise<PingResponse> {
  return apiClient.post<PingResponse>("health/ping", { message } as PingRequest);
}

import { apiClient } from "./client";
import { TraceRequestPayload, TraceResponsePayload } from "./types";

export const traceApi = {
  trace: (payload: TraceRequestPayload): Promise<TraceResponsePayload> =>
    apiClient.post<TraceResponsePayload>("trace", payload),
};

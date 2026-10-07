import { apiClient } from "./client";
import { ExecuteRequestPayload, ExecuteResponsePayload } from "./types";

export const executionApi = {
  execute: (payload: ExecuteRequestPayload): Promise<ExecuteResponsePayload> =>
    apiClient.post<ExecuteResponsePayload>("execute", payload),
};

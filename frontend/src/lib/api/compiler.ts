import { apiClient } from "./client";
import { CompileRequestPayload, CompileResponsePayload } from "./types";

export const compilerApi = {
  compile: (payload: CompileRequestPayload): Promise<CompileResponsePayload> =>
    apiClient.post<CompileResponsePayload>("compile", payload),
};

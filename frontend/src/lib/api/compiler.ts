import { apiClient } from "./client";
import {
  CompileRequestPayload,
  CompileResponsePayload,
  CompilerPipelineRequestPayload,
  CompilerPipelineResponsePayload,
} from "./types";

export const compilerApi = {
  compile: (payload: CompileRequestPayload): Promise<CompileResponsePayload> =>
    apiClient.post<CompileResponsePayload>("compile", payload),

  inspectPipeline: (
    payload: CompilerPipelineRequestPayload
  ): Promise<CompilerPipelineResponsePayload> =>
    apiClient.post<CompilerPipelineResponsePayload>("compiler/pipeline", payload),
};

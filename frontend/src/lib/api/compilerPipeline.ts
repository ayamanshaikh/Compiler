import { apiClient } from "./client";
import {
  CompilerPipelineRequestPayload,
  CompilerPipelineResponsePayload,
} from "./types";

export const compilerPipelineApi = {
  inspectPipeline: (
    payload: CompilerPipelineRequestPayload
  ): Promise<CompilerPipelineResponsePayload> =>
    apiClient.post<CompilerPipelineResponsePayload>("compiler/pipeline", payload),
};

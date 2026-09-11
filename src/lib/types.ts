export interface CompileResponse {
  success: boolean;
  message: string;
  error: string | null;
  explanation: string | null;
  lineNumber: number;
  suggestion: string | null;
  output: string | null;
  executionSteps?: ExecutionStep[];
  executionTraceTruncated?: boolean;
}

export interface ExecutionVariable {
  name: string;
  value: string;
  type: string;
  changed: boolean;
}

export interface ExecutionStep {
  step: number;
  lineNumber: number;
  code: string;
  action: string;
  explanation: string;
  variables: Record<string, string>;
  arrays: Record<string, number[]>;
  typedArrays?: Record<string, { type: string; values: string[] }>;
  highlights: number[];
  comparison?: {
    left: number;
    right: number;
    indices: number[];
    result: boolean;
    operator?: string;
  };
  swap?: {
    indices: [number, number];
    before: number[];
    after: number[];
  };
  callDepth?: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  language: string;
  code: string;
  success: boolean;
  message: string;
  output: string | null;
  error: string | null;
}

export type CompilationStatus = "idle" | "compiling" | "success" | "error";

export type AnalysisTab = "output" | "explain" | "visualize";
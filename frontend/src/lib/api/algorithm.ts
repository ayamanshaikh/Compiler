import { apiClient } from "./client";

export type AlgorithmCategory =
  | "SORTING"
  | "SEARCHING"
  | "TWO_POINTERS"
  | "DATA_STRUCTURES";

export type HighlightType =
  | "COMPARING"
  | "SWAPPING"
  | "SORTED"
  | "PIVOT"
  | "POINTER_LEFT"
  | "POINTER_RIGHT"
  | "POINTER_MID"
  | "ACTIVE"
  | "FOUND"
  | "DISCARDED";

export interface AlgorithmStep {
  stepIndex: number;
  line: number;
  description: string;
  arrayState: number[];
  highlights: Record<number, HighlightType>;
  comparisons: number;
  swaps: number;
  extra: Record<string, unknown>;
}

export interface AlgorithmMetadata {
  slug: string;
  name: string;
  category: AlgorithmCategory;
  description: string;
  timeComplexityBest: string;
  timeComplexityAverage: string;
  timeComplexityWorst: string;
  spaceComplexity: string;
  javaCode: string;
  defaultInput: number[];
  defaultTarget?: number;
}

export interface AlgorithmTraceResponse {
  algorithmSlug: string;
  algorithmName: string;
  steps: AlgorithmStep[];
  totalSteps: number;
  totalComparisons: number;
  totalSwaps: number;
  success: boolean;
}

export async function fetchAlgorithms(): Promise<AlgorithmMetadata[]> {
  return apiClient.get<AlgorithmMetadata[]>("algorithms");
}

export async function fetchAlgorithmBySlug(slug: string): Promise<AlgorithmMetadata> {
  return apiClient.get<AlgorithmMetadata>(`algorithms/${slug}`);
}

export async function generateAlgorithmTrace(
  slug: string,
  input?: number[],
  target?: number
): Promise<AlgorithmTraceResponse> {
  return apiClient.post<AlgorithmTraceResponse>(`algorithms/${slug}/trace`, {
    input,
    target,
  });
}

import { apiClient } from "./client";

export type QuestionType =
  | "MCQ"
  | "PREDICT_OUTPUT"
  | "FIND_ERROR"
  | "FIX_CODE"
  | "WRITE_CODE"
  | "DEBUG_CODE"
  | "MATCH_CONCEPT"
  | "ALGORITHM";

export type PracticeDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface PracticeQuestion {
  id: number;
  topicSlug: string;
  questionType: QuestionType;
  difficulty: PracticeDifficulty;
  title: string;
  prompt: string;
  codeSnippet?: string;
  options: string[];
  expectedOutput?: string;
  starterCode?: string;
  hint?: string;
  createdAt: string;
}

export interface PracticeSubmitRequest {
  questionId: number;
  userAnswer?: string;
  sourceCode?: string;
}

export interface PracticeSubmitResponse {
  questionId: number;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  feedback: string;
  compilerOutput?: string;
  compilerStatus?: string;
  compilerDiagnostics: string[];
}

export interface PerformanceMetric {
  attempts: number;
  correct: number;
  accuracyPercentage: number;
}

export interface PracticeStatsResponse {
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  topicPerformance: Record<string, PerformanceMetric>;
  difficultyPerformance: Record<string, PerformanceMetric>;
}

export interface PracticeFilterParams {
  topic?: string;
  difficulty?: string;
  type?: string;
}

export async function fetchPracticeQuestions(
  params?: PracticeFilterParams
): Promise<PracticeQuestion[]> {
  return apiClient.get<PracticeQuestion[]>("practice/questions", {
    params: {
      topic: params?.topic,
      difficulty: params?.difficulty,
      type: params?.type,
    },
  });
}

export async function fetchPracticeQuestionById(
  id: number
): Promise<PracticeQuestion> {
  return apiClient.get<PracticeQuestion>(`practice/questions/${id}`);
}

export async function submitPracticeAnswer(
  request: PracticeSubmitRequest
): Promise<PracticeSubmitResponse> {
  return apiClient.post<PracticeSubmitResponse>("practice/submit", request);
}

export async function fetchPracticeStats(): Promise<PracticeStatsResponse> {
  return apiClient.get<PracticeStatsResponse>("practice/stats");
}

export async function resetPracticeStats(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("practice/stats/reset", {});
}

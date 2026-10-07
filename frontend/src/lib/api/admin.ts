import { apiClient } from "./client";
import { UserRole } from "./auth";
import { TopicDifficulty, TopicSummary, TopicDetail, CodeExample } from "./types";

export interface AdminMetricsResponse {
  heapUsedBytes: number;
  heapMaxBytes: number;
  heapTotalBytes: number;
  heapFreeBytes: number;
  heapUsedMb: number;
  heapMaxMb: number;
  uptimeMillis: number;
  uptimeFormatted: string;
  availableProcessors: number;
  threadCount: number;
  totalTopics: number;
  totalQuestions: number;
  totalUsers: number;
  studentsCount: number;
  instructorsCount: number;
  adminsCount: number;
  compilationEngineStatus: string;
  compilationEngineName: string;
  guestAttempts: number;
  guestCorrect: number;
  guestIncorrect: number;
  totalCacheEntries?: number;
  cacheHits?: number;
  cacheMisses?: number;
  cacheHitRatio?: number;
  cacheEntryCounts?: Record<string, number>;
}

export interface AdminAuditLog {
  id: number;
  action: string;
  details: string;
  createdAt: string;
}

export interface AdminUserSummary {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  solvedQuestionsCount: number;
  completedTopicsCount: number;
  bookmarkedAlgorithmsCount: number;
  savedSnippetsCount: number;
}

export type QuestionType =
  | "MCQ"
  | "PREDICT_OUTPUT"
  | "FIND_ERROR"
  | "FIX_CODE"
  | "WRITE_CODE"
  | "DEBUG_CODE"
  | "MATCH_CONCEPT"
  | "ALGORITHM";

export interface AdminPracticeQuestion {
  id: number;
  topicSlug: string;
  questionType: QuestionType;
  difficulty: TopicDifficulty;
  title: string;
  prompt: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: string;
  expectedOutput?: string;
  starterCode?: string;
  explanation: string;
  hint?: string;
  createdAt: string;
}

export interface TopicCreatePayload {
  title: string;
  slug: string;
  description: string;
  difficulty: TopicDifficulty;
  internalUnit?: string;
  sortOrder: number;
  explanation?: string;
  whyItMatters?: string;
  syntax?: string;
  keyPoints: string[];
  commonMistakes: string[];
  relatedTopicSlugs: string[];
  codeExamples: CodeExample[];
}

export interface AdminQuestionCreatePayload {
  topicSlug: string;
  questionType: QuestionType;
  difficulty: TopicDifficulty;
  title: string;
  prompt: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: string;
  expectedOutput?: string;
  starterCode?: string;
  explanation: string;
  hint?: string;
}

export async function fetchAdminMetrics(): Promise<AdminMetricsResponse> {
  return apiClient.get<AdminMetricsResponse>("admin/metrics");
}

export async function fetchAdminAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
  return apiClient.get<AdminAuditLog[]>("admin/audit-logs", { params: { limit } });
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  return apiClient.get<AdminUserSummary[]>("admin/users");
}

export async function updateUserRole(userId: number, role: UserRole): Promise<AdminUserSummary> {
  return apiClient.put<AdminUserSummary>(`admin/users/${userId}/role`, { role });
}

export async function fetchAdminTopics(params?: {
  difficulty?: string;
  search?: string;
}): Promise<TopicSummary[]> {
  return apiClient.get<TopicSummary[]>("admin/topics", { params });
}

export async function fetchAdminTopicById(id: number): Promise<TopicDetail> {
  return apiClient.get<TopicDetail>(`admin/topics/${id}`);
}

export async function createAdminTopic(payload: TopicCreatePayload): Promise<TopicDetail> {
  return apiClient.post<TopicDetail>("admin/topics", payload);
}

export async function updateAdminTopic(id: number, payload: TopicCreatePayload): Promise<TopicDetail> {
  return apiClient.put<TopicDetail>(`admin/topics/${id}`, payload);
}

export async function deleteAdminTopic(id: number): Promise<void> {
  return apiClient.delete<void>(`admin/topics/${id}`);
}

export async function fetchAdminQuestions(params?: {
  topic?: string;
  difficulty?: string;
  type?: string;
}): Promise<AdminPracticeQuestion[]> {
  return apiClient.get<AdminPracticeQuestion[]>("admin/questions", { params });
}

export async function fetchAdminQuestionById(id: number): Promise<AdminPracticeQuestion> {
  return apiClient.get<AdminPracticeQuestion>(`admin/questions/${id}`);
}

export async function createAdminQuestion(payload: AdminQuestionCreatePayload): Promise<AdminPracticeQuestion> {
  return apiClient.post<AdminPracticeQuestion>("admin/questions", payload);
}

export async function updateAdminQuestion(
  id: number,
  payload: AdminQuestionCreatePayload
): Promise<AdminPracticeQuestion> {
  return apiClient.put<AdminPracticeQuestion>(`admin/questions/${id}`, payload);
}

export async function deleteAdminQuestion(id: number): Promise<void> {
  return apiClient.delete<void>(`admin/questions/${id}`);
}
